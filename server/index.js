require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { createGame, getGame, addPlayer, removePlayer, startRound, submitAnswer, revealRound, resetGame, getAllPlayerNames, trackQuestion } = require('./gameState');
const { generatePrompt, groupAnswers } = require('./aiService');
const { saveGameResult } = require('./supabase');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Serve static client build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));
}

const ROUND_DURATION = 25;
const DISCONNECT_GRACE_MS = 30000;

function getRoom(gameCode) { return `game:${gameCode}`; }

function emitLobbyUpdate(gameCode) {
  const game = getGame(gameCode);
  if (!game) return;
  const players = Object.values(game.players).filter(p => !p.disconnected).map(p => p.name);
  io.to(getRoom(gameCode)).emit('lobby_update', { players });
}

async function doReveal(gameCode) {
  const game = getGame(gameCode);
  if (!game || game.status !== 'round') return;

  const answers = Object.entries(game.currentRound.answers).map(([sid, a]) => ({
    socketId: sid,
    name: game.players[sid]?.name || 'Okänd',
    text: a.text,
    responseTimeSeconds: a.responseTime
  }));

  let groupingResult;
  try {
    groupingResult = await groupAnswers(answers);
  } catch (e) {
    console.error('groupAnswers failed:', e.message);
    groupingResult = null;
  }

  const revealData = revealRound(gameCode, groupingResult);
  if (!revealData) return;

  game.lastRevealData = revealData;
  io.to(getRoom(gameCode)).emit('round_reveal', revealData);

  if (revealData.gameOver) {
    // short delay then emit game_ended
    setTimeout(() => {
      const g = getGame(gameCode);
      if (!g) return;
      const finalPlayers = Object.values(g.players).map(p => ({ name: p.name, sipBank: p.sipBank }));
      const endData = { winner: revealData.winner, finalPlayers };
      g.lastEndData = endData;
      io.to(getRoom(gameCode)).emit('game_ended', endData);
      // Save to Supabase
      saveGameResult({
        gameCode,
        rounds: g.roundHistory.length,
        players: finalPlayers,
        winner: revealData.winner
      });
    }, 1000);
  }
}

io.on('connection', (socket) => {
  console.log('connected:', socket.id);

  socket.on('create_game', ({ name } = {}) => {
    const code = createGame(socket.id);
    socket.join(getRoom(code));
    // Host joins as a player too if they provided a name
    if (name && name.trim()) {
      addPlayer(code, socket.id, name.trim());
    }
    socket.emit('game_created', { code, name: name?.trim() || '' });
    console.log('Game created:', code);
  });

  socket.on('join_game', ({ code, name }) => {
    const game = getGame(code);
    if (!game) { socket.emit('error', { message: 'Spelkoden hittades inte.' }); return; }
    if (game.status !== 'lobby') { socket.emit('error', { message: 'Spelet har redan börjat.' }); return; }
    if (!name || name.trim().length < 1) { socket.emit('error', { message: 'Du måste ange ett namn.' }); return; }

    addPlayer(code, socket.id, name.trim());
    socket.join(getRoom(code));
    socket.emit('joined_game', { code, name: name.trim() });
    emitLobbyUpdate(code);
  });

  socket.on('start_game', async () => {
    // find game where socket is host
    const { games } = require('./gameState');
    const entry = Object.entries(games).find(([, g]) => g.hostSocketId === socket.id);
    if (!entry) return;
    const [gameCode, game] = entry;
    if (Object.keys(game.players).length < 1) {
      socket.emit('error', { message: 'Minst en spelare behövs.' });
      return;
    }

    game.status = 'round';
    const roundNumber = game.roundHistory.length + 1;
    const q = await generatePrompt({
      roundNumber,
      recentQuestionIds: game.recentQuestionIds,
      recentCategories: game.recentCategories,
      recentTags: game.recentTags
    });
    trackQuestion(gameCode, q);
    startRound(gameCode, q.question);

    io.to(getRoom(gameCode)).emit('game_started', {});
    io.to(getRoom(gameCode)).emit('round_start', { prompt: q.question, duration: ROUND_DURATION, roundNumber });

    // auto-reveal after the round duration if not everyone submitted
    game._roundTimer = setTimeout(() => doReveal(gameCode), ROUND_DURATION * 1000);
  });

  socket.on('submit_answer', ({ text }) => {
    const { games } = require('./gameState');
    const entry = Object.entries(games).find(([, g]) => g.players[socket.id]);
    if (!entry) return;
    const [gameCode, game] = entry;
    if (game.status !== 'round') return;

    const responseTime = (Date.now() - game.currentRound.startTime) / 1000;
    submitAnswer(gameCode, socket.id, text, responseTime);
    socket.emit('answer_received', {});

    // check if all submitted
    const playerIds = Object.keys(game.players);
    const answeredIds = Object.keys(game.currentRound.answers);
    if (playerIds.every(id => answeredIds.includes(id))) {
      if (game._roundTimer) { clearTimeout(game._roundTimer); game._roundTimer = null; }
      doReveal(gameCode);
    }
  });

  socket.on('next_round', async () => {
    const { games } = require('./gameState');
    const entry = Object.entries(games).find(([, g]) => g.hostSocketId === socket.id);
    if (!entry) return;
    const [gameCode, game] = entry;

    game.status = 'round';
    const roundNumber = game.roundHistory.length + 1;
    const q = await generatePrompt({
      roundNumber,
      recentQuestionIds: game.recentQuestionIds,
      recentCategories: game.recentCategories,
      recentTags: game.recentTags
    });
    trackQuestion(gameCode, q);
    startRound(gameCode, q.question);

    io.to(getRoom(gameCode)).emit('round_start', { prompt: q.question, duration: ROUND_DURATION, roundNumber });

    game._roundTimer = setTimeout(() => doReveal(gameCode), ROUND_DURATION * 1000);
  });

  socket.on('assign_shot', ({ targetName, targetSocketId }) => {
    const { games } = require('./gameState');
    const entry = Object.entries(games).find(([, g]) => g.hostSocketId === socket.id || g.players[socket.id]);
    if (!entry) return;
    const [gameCode, game] = entry;
    // accept either targetName directly or resolve from targetSocketId
    const name = targetName || game.players[targetSocketId]?.name || 'Okänd';
    io.to(getRoom(gameCode)).emit('shot_assigned', { targetName: name });
  });

  socket.on('play_again', () => {
    const { games } = require('./gameState');
    const entry = Object.entries(games).find(([, g]) => g.hostSocketId === socket.id);
    if (!entry) return;
    const [gameCode] = entry;
    resetGame(gameCode);
    emitLobbyUpdate(gameCode);
    io.to(getRoom(gameCode)).emit('back_to_lobby', {});
  });

  socket.on('rejoin_game', ({ code, name }) => {
    const game = getGame(code);
    if (!game) { socket.emit('rejoin_failed', {}); return; }
    const entry = Object.entries(game.players).find(([, p]) => p.disconnected && p.name === name);
    if (!entry) { socket.emit('rejoin_failed', {}); return; }
    const [oldSocketId, player] = entry;

    clearTimeout(player.disconnectTimer);
    player.disconnectTimer = null;
    player.disconnected = false;
    delete game.players[oldSocketId];
    game.players[socket.id] = player;
    if (game.hostSocketId === oldSocketId) game.hostSocketId = socket.id;

    // Carry over an already-submitted answer for this round, if any
    let alreadyAnswered = false;
    if (game.currentRound && game.currentRound.answers[oldSocketId]) {
      game.currentRound.answers[socket.id] = game.currentRound.answers[oldSocketId];
      delete game.currentRound.answers[oldSocketId];
      alreadyAnswered = true;
    }

    socket.join(getRoom(code));
    emitLobbyUpdate(code);

    const payload = {
      code,
      name,
      isHost: game.hostSocketId === socket.id,
      status: game.status,
      players: Object.values(game.players).filter(p => !p.disconnected).map(p => p.name)
    };

    if (game.status === 'round' && game.currentRound) {
      const elapsed = (Date.now() - game.currentRound.startTime) / 1000;
      payload.prompt = game.currentRound.prompt;
      payload.duration = Math.max(0, Math.ceil(ROUND_DURATION - elapsed));
      payload.roundNumber = game.roundHistory.length + 1;
      payload.alreadyAnswered = alreadyAnswered;
    } else if (game.status === 'reveal' && game.lastRevealData) {
      payload.revealData = game.lastRevealData;
    } else if (game.status === 'ended' && game.lastEndData) {
      payload.endData = game.lastEndData;
    }

    socket.emit('rejoined', payload);
  });

  socket.on('disconnect', () => {
    console.log('disconnected:', socket.id);
    const { games } = require('./gameState');
    // find if this socket is in any game as player
    const entry = Object.entries(games).find(([, g]) => g.players[socket.id]);
    if (!entry) return;
    const [gameCode, game] = entry;

    if (game.status === 'ended') {
      removePlayer(gameCode, socket.id);
      emitLobbyUpdate(gameCode);
      return;
    }

    // Grace period: keep the player's state (sip bank, etc.) so a brief
    // wifi drop or screen-lock doesn't kick them out of the game.
    const player = game.players[socket.id];
    player.disconnected = true;
    emitLobbyUpdate(gameCode);
    player.disconnectTimer = setTimeout(() => {
      removePlayer(gameCode, socket.id);
      emitLobbyUpdate(gameCode);
    }, DISCONNECT_GRACE_MS);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
