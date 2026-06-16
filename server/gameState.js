const games = {};

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function createGame(hostSocketId) {
  let code;
  do { code = generateCode(); } while (games[code]);
  games[code] = {
    hostSocketId,
    status: 'lobby',
    players: {},
    currentRound: null,
    roundHistory: [],
    _roundTimer: null
  };
  return code;
}

function getGame(code) { return games[code] || null; }

function addPlayer(code, socketId, name) {
  if (!games[code]) return false;
  games[code].players[socketId] = { name, sipBank: 12, totalResponseTime: 0 };
  return true;
}

function removePlayer(code, socketId) {
  if (!games[code]) return;
  delete games[code].players[socketId];
}

function startRound(code, prompt) {
  if (!games[code]) return;
  games[code].currentRound = {
    prompt,
    startTime: Date.now(),
    answers: {},
    groupingResult: null,
    isChaos: false,
    isUnanimous: false,
    randomChaosSips: null
  };
}

function submitAnswer(code, socketId, text, responseTime) {
  if (!games[code] || !games[code].currentRound) return;
  games[code].currentRound.answers[socketId] = { text: text.trim(), responseTime };
  games[code].players[socketId].totalResponseTime += responseTime;
}

function fallbackGroup(answers) {
  const groups = {};
  for (const a of answers) {
    const key = a.text.toLowerCase().trim();
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  }
  return Object.entries(groups).map(([label, members]) => ({ label, members }));
}

const ROAST_TEMPLATES = [
  (w) => `${w} är verkligen den mest förutsägbara personen i rummet – men förutsägbarhet är en dygd.`,
  (w) => `Svaren är som en IKEA-manual – alla tror sig förstå, men det är bara ${w} som faktiskt gör det.`,
  (w) => `Klart att ${w} vinner – de har övat på att vara mainstream sedan dagis.`,
  (w) => `${w} och hjorden – beviset på att Sverige faktiskt är ett kollektivistiskt samhälle.`,
  (w) => `Inte ens ett AI kan komma på roligare svar, men ${w} tar hem vinsten ändå.`,
];
const CHAOS_ROASTS = [
  'Kaos! Ingen tänkte likadant den här gången. Skål allihopa!',
  'Det var precis lika rörigt som en midsommarfirning. Drick upp!'
];

function revealRound(code, aiGroupingResult) {
  const game = games[code];
  if (!game || !game.currentRound) return null;

  const round = game.currentRound;
  const answers = Object.entries(round.answers).map(([sid, a]) => ({
    socketId: sid,
    name: game.players[sid]?.name || 'Okänd',
    text: a.text,
    responseTime: a.responseTime
  }));

  if (answers.length === 0) {
    game.roundHistory.push({ prompt: round.prompt, groups: [], isChaos: true });
    game.status = 'reveal';
    return { groups: [], herdLabel: null, isChaos: true, isUnanimous: false, randomChaosSips: 2, roast: 'Ingen svarade! Skäms och drick.', outcomes: [], gameOver: false, winner: null };
  }

  let groups;
  if (aiGroupingResult && aiGroupingResult.groups && aiGroupingResult.groups.length > 0) {
    const nameToSocket = {};
    for (const a of answers) nameToSocket[a.name] = a.socketId;
    groups = aiGroupingResult.groups.map(g => ({
      label: g.label,
      members: g.members.map(m => ({
        socketId: nameToSocket[m.name] || '',
        name: m.name,
        text: m.text,
        responseTime: typeof m.responseTime === 'number' ? m.responseTime : 0
      }))
    }));
  } else {
    groups = fallbackGroup(answers);
  }

  const maxSize = Math.max(...groups.map(g => g.members.length));
  const largestGroups = groups.filter(g => g.members.length === maxSize);
  const isUnanimous = groups.length === 1 && groups[0].members.length === answers.length;
  const isChaos = !isUnanimous && (largestGroups.length > 1 || maxSize === 1);

  let herdLabel = null, herdGroup = null, roast = '', randomChaosSips = null;
  const outcomes = [];

  if (isChaos) {
    randomChaosSips = Math.floor(Math.random() * 5) + 2;
    roast = CHAOS_ROASTS[Math.floor(Math.random() * CHAOS_ROASTS.length)];
    for (const a of answers) outcomes.push({ socketId: a.socketId, name: a.name, action: 'drink_now', amount: randomChaosSips });
  } else {
    herdGroup = isUnanimous ? groups[0] : largestGroups[0];
    herdLabel = herdGroup.label;
    const herdMembers = [...herdGroup.members].sort((a, b) => a.responseTime - b.responseTime);
    const outliers = answers.filter(a => !herdGroup.members.find(m => m.socketId === a.socketId));

    herdMembers.forEach((member, i) => {
      const deduct = i === 0 ? 3 : i === 1 ? 2 : 1;
      if (game.players[member.socketId]) game.players[member.socketId].sipBank -= deduct;
      outcomes.push({ socketId: member.socketId, name: member.name, action: 'sip_bank_deduct', amount: deduct });
    });

    if (!isUnanimous) {
      for (const o of outliers) outcomes.push({ socketId: o.socketId, name: o.name, action: 'drink_now', amount: 2 });
    }

    const winnerName = herdMembers[0]?.name || 'Någon';
    const fn = ROAST_TEMPLATES[Math.floor(Math.random() * ROAST_TEMPLATES.length)];
    roast = (aiGroupingResult && aiGroupingResult.roast) ? aiGroupingResult.roast : fn(winnerName);
  }

  let gameOver = false, winner = null;
  const depleted = Object.entries(game.players).filter(([, p]) => p.sipBank <= 0);
  if (depleted.length > 0) {
    gameOver = true;
    depleted.sort((a, b) => a[1].sipBank !== b[1].sipBank ? a[1].sipBank - b[1].sipBank : a[1].totalResponseTime - b[1].totalResponseTime);
    const [wId, wData] = depleted[0];
    winner = { socketId: wId, name: wData.name };
    game.status = 'ended';
  } else {
    game.status = 'reveal';
  }

  round.isChaos = isChaos;
  round.isUnanimous = isUnanimous;
  round.randomChaosSips = randomChaosSips;
  game.roundHistory.push({ prompt: round.prompt, groups, isChaos });

  return {
    groups: groups.map(g => ({
      label: g.label,
      members: g.members.map(m => ({ name: m.name, answer: m.text, responseTime: m.responseTime })),
      isHerd: !isChaos && g.label === herdLabel
    })),
    herdLabel, isChaos, isUnanimous, randomChaosSips, roast,
    outcomes: outcomes.map(o => ({ name: o.name, action: o.action, amount: o.amount })),
    gameOver, winner
  };
}

function resetGame(code) {
  const game = games[code];
  if (!game) return;
  for (const sid of Object.keys(game.players)) {
    game.players[sid].sipBank = 12;
    game.players[sid].totalResponseTime = 0;
  }
  game.status = 'lobby';
  game.currentRound = null;
  game.roundHistory = [];
}

module.exports = { games, createGame, getGame, addPlayer, removePlayer, startRound, submitAnswer, revealRound, resetGame };
