require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { createGame, getGame, addPlayer, removePlayer, startRound, submitAnswer, revealRound, resetGame, getAllPlayerNames } = require('./gameState');
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

function getRoom(gameCode) { return `game:${gameCode}`; }

function emitLobbyUpdate(gameCode) {
  const game = getGame(gameCode);
  if (!game) return;
  const players = Object.values(game.players).map(p => p.name);
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

  io.to(getRoom(gameCode)).emit('round_reveal', revealData);

  if (revealData.gameOver) {
    // short delay then emit game_ended
    setTimeout(() => {
      const g = getGame(gameCode);
      if (!g) return;
      const finalPlayers = Object.values(g.players).map(p => ({ name: p.name, sipBank: p.sipBank }));
      io.to(getRoom(gameCode)).emit('game_ended', {
        winner: revealData.winner,
        finalPlayers
      });
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

  socket.on('create_game', () => {
    const code = createGame(socket.id);
    socket.join(getRoom(code));
    socket.emit('game_created', { code });
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
    const prompt = await generatePrompt(game.roundHistory.map(r => r.prompt));
    startRound(gameCode, prompt);

    io.to(getRoom(gameCode)).emit('game_started', {});
    io.to(getRoom(gameCode)).emit('round_start', { prompt, duration: 25, roundNumber: game.roundHistory.length + 1 });

    // auto-reveal after 25s if not everyone submitted
    game._roundTimer = setTimeout(() => doReveal(gameCode), 25000);
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
    const prompt = await generatePrompt(game.roundHistory.map(r => r.prompt));
    startRound(gameCode, prompt);

    io.to(getRoom(gameCode)).emit('round_start', { prompt, duration: 25, roundNumber: game.roundHistory.length });

    game._roundTimer = setTimeout(() => doReveal(gameCode), 25000);
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

  socket.on('disconnect', () => {
    console.log('disconnected:', socket.id);
    const { games } = require('./gameState');
    // find if this socket is in any game as player
    const entry = Object.entries(games).find(([, g]) => g.players[socket.id]);
    if (entry) {
      const [gameCode] = entry;
      removePlayer(gameCode, socket.id);
      emitLobbyUpdate(gameCode);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
