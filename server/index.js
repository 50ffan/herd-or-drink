require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createGame, getGame, getGameBySocketId, addPlayer, removePlayer } = require('./gameState');
const { groupAnswers } = require('./aiService');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3001;

const PROMPTS = [
  "Vad är det bästa man kan säga för att avsluta ett första dejt?",
  "Vad skulle du göra om du vann 10 miljoner på lotto?",
  "Vad är den värsta ursäkten för att komma för sent till jobbet?",
  "Vad är det första du gör på en ledig lördag?",
  "Vad är det absolut sämsta pizzatoppingen?",
  "Vad säger man när man är påkommen med att ljuga?",
  "Vad är det bästa sättet att sluta ett argument?",
  "Vad är den mest överskattade aktiviteten?",
  "Vad skulle din ex säga om dig?",
  "Vad är det första du packar inför en resa?",
  "Vad är det mest irriterande en kollega kan göra?",
  "Hur imponerar man på en svensk?",
  "Vad säger du om du ser ditt ex på ICA?",
  "Vad är den bästa ursäkten för att hoppa över gymmet?",
  "Vad är det viktigaste egenskapen hos en perfekt partner?",
  "Vad gör du direkt när du kommer hem från jobbet?",
  "Vad är den hemligaste saken du gör när ingen ser?",
  "Hur avslutar du ett samtal du vill komma ur?"
];

const ROAST_TEMPLATES = [
  "{winner} är verkligen den mest förutsägbara personen i rummet – men det är okej, förutsägbarhet är en dygd.",
  "Svaren här är som en IKEA-manual – alla tror de förstår, men det är bara {winner} som faktiskt gör det.",
  "Klart att {winner} vinner – de har övat på att vara medelmåttig sedan dagis.",
  "Inte ens ett AI kan komma på en roligare grupp svar, men {winner} tar hem vinsten ändå.",
  "{winner} och resten av hjorden – beviset på att Sverige faktiskt är ett kollektivistiskt samhälle."
];

const CHAOS_ROASTS = [
  "Kaos! Ingen tänkte likadant den här gången. Skål allihopa!",
  "Det var precis lika rörigt som en midsommarfirning. Drick upp!"
];

const roundTimers = {};

function pickPrompt(game) {
  const available = PROMPTS.filter(p => !game.usedPrompts.includes(p));
  if (available.length === 0) {
    game.usedPrompts = [];
    return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  }
  const prompt = available[Math.floor(Math.random() * available.length)];
  game.usedPrompts.push(prompt);
  return prompt;
}

function startRound(io, code, game) {
  const prompt = pickPrompt(game);
  const roundNumber = game.roundHistory.length + 1;
  game.status = 'round';
  game.currentRound = {
    prompt,
    startTime: Date.now(),
    answers: {},
    groupingResult: null,
    isChaos: false,
    isUnanimous: false,
    randomChaosSips: null,
    roundNumber
  };

  io.to(code).emit('round_start', { prompt, duration: 25, roundNumber });

  if (roundTimers[code]) clearTimeout(roundTimers[code]);
  roundTimers[code] = setTimeout(() => {
    const g = getGame(code);
    if (g && g.status === 'round') {
      revealRound(io, code, g);
    }
  }, 25000);
}

function revealRound(io, code, game) {
  if (roundTimers[code]) { clearTimeout(roundTimers[code]); delete roundTimers[code]; }
  if (game.status !== 'round') return;
  game.status = 'reveal';

  const round = game.currentRound;
  const playerIds = Object.keys(game.players);

  for (const sid of playerIds) {
    if (!round.answers[sid]) {
      round.answers[sid] = { text: '', responseTime: 25 };
    }
  }

  const groups = groupAnswers(round.answers);

  const totalPlayers = playerIds.length;
  const maxGroupSize = Math.max(...groups.map(g => g.members.length));
  const largestGroups = groups.filter(g => g.members.length === maxGroupSize);

  let isChaos = false;
  let isUnanimous = false;
  let herdGroup = null;
  let randomChaosSips = null;

  if (groups.length === totalPlayers) {
    isChaos = true;
  } else if (largestGroups.length > 1) {
    isChaos = true;
  } else if (maxGroupSize === totalPlayers) {
    isUnanimous = true;
    herdGroup = largestGroups[0];
  } else {
    herdGroup = largestGroups[0];
  }

  if (isChaos) {
    randomChaosSips = Math.floor(Math.random() * 5) + 2;
  }

  let roast;
  if (isChaos) {
    roast = CHAOS_ROASTS[Math.floor(Math.random() * CHAOS_ROASTS.length)];
  } else {
    const herdMembers = herdGroup.members.slice().sort((a, b) => a.responseTime - b.responseTime);
    const winnerName = game.players[herdMembers[0].socketId]?.name || 'Okänd';
    const template = ROAST_TEMPLATES[Math.floor(Math.random() * ROAST_TEMPLATES.length)];
    roast = template.replace('{winner}', winnerName);
  }

  const outcomes = [];

  if (isChaos) {
    for (const sid of playerIds) {
      const p = game.players[sid];
      p.totalResponseTime += round.answers[sid].responseTime;
      outcomes.push({ name: p.name, socketId: sid, action: 'drink_now', amount: randomChaosSips });
    }
  } else if (isUnanimous) {
    const sorted = herdGroup.members.slice().sort((a, b) => a.responseTime - b.responseTime);
    sorted.forEach((m, i) => {
      const p = game.players[m.socketId];
      p.totalResponseTime += m.responseTime;
      let deduct = i === 0 ? 3 : i === 1 ? 2 : 1;
      p.sipBank -= deduct;
      outcomes.push({ name: p.name, socketId: m.socketId, action: 'sip_bank_deduct', amount: deduct });
    });
  } else {
    const herdSocketIds = new Set(herdGroup.members.map(m => m.socketId));
    const herdSorted = herdGroup.members.slice().sort((a, b) => a.responseTime - b.responseTime);

    herdSorted.forEach((m, i) => {
      const p = game.players[m.socketId];
      p.totalResponseTime += m.responseTime;
      let deduct = i === 0 ? 3 : i === 1 ? 2 : 1;
      p.sipBank -= deduct;
      outcomes.push({ name: p.name, socketId: m.socketId, action: 'sip_bank_deduct', amount: deduct });
    });

    for (const sid of playerIds) {
      if (!herdSocketIds.has(sid)) {
        const p = game.players[sid];
        p.totalResponseTime += round.answers[sid].responseTime;
        outcomes.push({ name: p.name, socketId: sid, action: 'drink_now', amount: 2 });
      }
    }
  }

  const minSipBank = Math.min(...playerIds.map(sid => game.players[sid].sipBank));
  let gameOver = minSipBank <= 0;
  let winner = null;

  if (gameOver) {
    const sorted = playerIds.slice().sort((a, b) => {
      const diff = game.players[a].sipBank - game.players[b].sipBank;
      if (diff !== 0) return diff;
      return game.players[a].totalResponseTime - game.players[b].totalResponseTime;
    });
    const winnerSid = sorted[0];
    winner = { name: game.players[winnerSid].name, socketId: winnerSid };
    game.status = 'ended';
  }

  const clientGroups = groups.map(g => ({
    label: g.label || '(inget svar)',
    members: g.members.map(m => ({
      name: game.players[m.socketId]?.name || 'Okänd',
      answer: m.text || '(inget svar)',
      responseTime: m.responseTime
    }))
  }));

  round.groupingResult = groups;
  round.isChaos = isChaos;
  round.isUnanimous = isUnanimous;
  round.randomChaosSips = randomChaosSips;
  game.roundHistory.push({ ...round });

  const revealPayload = {
    groups: clientGroups,
    herdLabel: herdGroup ? herdGroup.label : null,
    isChaos,
    isUnanimous,
    randomChaosSips,
    roast,
    outcomes: outcomes.map(o => ({ name: o.name, socketId: o.socketId, action: o.action, amount: o.amount })),
    gameOver,
    winner
  };

  io.to(code).emit('round_reveal', revealPayload);
}

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  socket.on('create_game', ({ name }) => {
    const { code, game } = createGame(socket.id, name || 'Värden');
    socket.join(code);
    socket.emit('game_created', { code });
    io.to(code).emit('lobby_update', { players: Object.values(game.players).map(p => p.name) });
  });

  socket.on('join_game', ({ code, name }) => {
    const upperCode = (code || '').toUpperCase();
    const game = getGame(upperCode);
    if (!game) { socket.emit('error', { message: 'Spelet hittades inte.' }); return; }
    if (game.status !== 'lobby') { socket.emit('error', { message: 'Spelet har redan börjat.' }); return; }

    addPlayer(upperCode, socket.id, name);
    socket.join(upperCode);
    socket.emit('joined_game', { code: upperCode, name });
    const players = Object.values(game.players).map(p => p.name);
    io.to(upperCode).emit('lobby_update', { players });
  });

  socket.on('start_game', () => {
    const result = getGameBySocketId(socket.id);
    if (!result) return;
    const { code, game } = result;
    if (game.hostSocketId !== socket.id) return;
    if (Object.keys(game.players).length < 2) return;
    io.to(code).emit('game_started');
    startRound(io, code, game);
  });

  socket.on('submit_answer', ({ text }) => {
    const result = getGameBySocketId(socket.id);
    if (!result) return;
    const { code, game } = result;
    if (game.status !== 'round') return;
    const round = game.currentRound;
    if (round.answers[socket.id]) return;

    const responseTime = (Date.now() - round.startTime) / 1000;
    round.answers[socket.id] = { text: text || '', responseTime };

    const playerCount = Object.keys(game.players).length;
    const answerCount = Object.keys(round.answers).length;

    if (answerCount >= playerCount) {
      revealRound(io, code, game);
    }
  });

  socket.on('next_round', () => {
    const result = getGameBySocketId(socket.id);
    if (!result) return;
    const { code, game } = result;
    if (game.hostSocketId !== socket.id) return;
    if (game.status === 'ended') return;
    startRound(io, code, game);
  });

  socket.on('play_again', () => {
    const result = getGameBySocketId(socket.id);
    if (!result) return;
    const { code, game } = result;
    if (game.hostSocketId !== socket.id) return;
    for (const sid of Object.keys(game.players)) {
      game.players[sid].sipBank = 12;
      game.players[sid].totalResponseTime = 0;
    }
    game.status = 'lobby';
    game.currentRound = null;
    game.roundHistory = [];
    game.usedPrompts = [];
    const players = Object.values(game.players).map(p => p.name);
    io.to(code).emit('lobby_update', { players });
    io.to(code).emit('play_again_reset');
  });

  socket.on('assign_shot', ({ targetSocketId }) => {
    const result = getGameBySocketId(socket.id);
    if (!result) return;
    const { code, game } = result;
    const targetPlayer = game.players[targetSocketId];
    if (!targetPlayer) return;
    io.to(code).emit('shot_assigned', { targetName: targetPlayer.name });
  });

  socket.on('disconnect', () => {
    const result = removePlayer(socket.id);
    if (!result || !result.game) return;
    const { code, game } = result;
    const players = Object.values(game.players).map(p => p.name);
    io.to(code).emit('lobby_update', { players });
  });
});

app.get('/health', (req, res) => res.json({ ok: true }));

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
