const games = {};
const { normalize, extractIntent, similarity } = require('./textNormalize');

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
    recentQuestionIds: [],
    recentCategories: [],
    recentTags: [],
    _roundTimer: null
  };
  return code;
}

// Records the question that was just asked so future selection can avoid repeats
// and prefer category/tag diversity. Caps each tracker at 20 entries.
function trackQuestion(code, q) {
  const game = games[code];
  if (!game || !q) return;
  if (q.id != null) {
    game.recentQuestionIds.push(q.id);
    if (game.recentQuestionIds.length > 20) game.recentQuestionIds.shift();
  }
  if (q.category) {
    game.recentCategories.push(q.category);
    if (game.recentCategories.length > 20) game.recentCategories.shift();
  }
  if (q.tags) {
    game.recentTags.push(q.tags);
    if (game.recentTags.length > 20) game.recentTags.shift();
  }
}

function getGame(code) { return games[code] || null; }

function addPlayer(code, socketId, name) {
  if (!games[code]) return;
  games[code].players[socketId] = { name, sipBank: 12, totalResponseTime: 0, disconnected: false, disconnectTimer: null };
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

// Two-layer fallback grouping (used when no ANTHROPIC_API_KEY is set):
// 1) normalize (case/punctuation/whitespace/lemma/synonyms)
// 2) match by strict deterministic intent pattern, else exact normalized text,
//    else fuzzy similarity (>85%) as a last resort for typos
function fallbackGroup(answers) {
  const buckets = [];
  for (const a of answers) {
    const normalized = normalize(a.text);
    const intent = extractIntent(a.text);
    const key = intent || normalized;

    let bucket = buckets.find(b => b.key === key);
    if (!bucket && !intent) {
      bucket = buckets.find(b => !b.intent && similarity(b.normalized, normalized) >= 0.85);
    }
    if (!bucket) {
      bucket = { key, intent, normalized, members: [] };
      buckets.push(bucket);
    }
    bucket.members.push(a);
  }
  return buckets.map(b => ({ label: b.members[0].text, members: b.members }));
}

const ROAST_TEMPLATES = [
  (winner) => `${winner} är verkligen den mest förutsägbara personen i rummet – men förutsägbarhet är en dygd.`,
  (winner) => `Svaren här är som en IKEA-manual – alla tror sig förstå, men det är bara ${winner} som faktiskt gör det.`,
  (winner) => `Klart att ${winner} vinner – de har övat på att vara mainstream sedan dagis.`,
  (winner) => `${winner} och flocken – beviset på att Sverige faktiskt är ett kollektivistiskt samhälle.`,
  (winner) => `Inte ens ett AI kan komma på en roligare grupp, men ${winner} tar hem vinsten ändå.`,
  (winner) => `${winner} tänker exakt som alla andra – grattis till att vara hundra procent genomsnittlig.`,
  (winner) => `Forskning visar att ${winner} skulle klara sig perfekt i en hjord av lämlar.`,
  (winner) => `${winner} har officiellt världens minst originella hjärna i rummet just nu.`,
  (winner) => `Om konformitet var en sport hade ${winner} tagit guld utan att svettas.`,
  (winner) => `${winner} – stolt medlem av "Jag tänker som alla andra"-klubben sedan idag.`,
  (winner) => `Ingen är förvånad att ${winner} hamnade här. Verkligen ingen.`,
  (winner) => `${winner} bevisar att man kan vinna utan en enda egen tanke.`,
  (winner) => `Snyggt jobbat ${winner}, du har precis vunnit ett mästerskap i att vara som alla andra.`,
  (winner) => `${winner} skulle förmodligen också säga "skål" om alla andra hoppade från en bro.`,
];
const CHAOS_ROASTS = [
  'Kaos! Ingen tänkte likadant den här gången. Skål allihopa!',
  'Det var precis lika rörigt som en midsommarfirning. Drick upp!',
  'Total anarki i svaren – ingen flock, bara individualister. Skål på det!',
  'Det här var mer spritt än julbordet på en svensk arbetsplats. Alla dricker!',
  'Ingen hjord hittades – ni är officiellt för unika för det här spelet. Skål!',
  'Lika synkade som ett IKEA-möte utan instruktioner. Drick upp, allihopa!',
  'Det här kaoset hade gjort en flockmentalitetsexpert arbetslös. Skål!',
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

  // Players who never submitted within the time limit
  const noAnswerIds = Object.keys(game.players).filter(sid => !round.answers[sid]);
  const outcomes = [];
  for (const sid of noAnswerIds) {
    outcomes.push({ socketId: sid, name: game.players[sid].name, action: 'drink_now', amount: 4 });
  }

  let groups = [];
  let herdLabel = null;
  let herdGroup = null;
  let roast = '';
  let randomChaosSips = null;
  let isChaos = false;
  let isUnanimous = false;

  if (answers.length === 0) {
    // Everyone timed out
    isChaos = true;
    roast = CHAOS_ROASTS[Math.floor(Math.random() * CHAOS_ROASTS.length)];
  } else {

  // Use AI grouping if available, otherwise fallback
  if (aiGroupingResult && aiGroupingResult.groups && aiGroupingResult.groups.length > 0) {
    groups = aiGroupingResult.groups;
  } else {
    groups = fallbackGroup(answers);
  }

  // Determine herd
  const maxSize = Math.max(...groups.map(g => g.members.length));
  const largestGroups = groups.filter(g => g.members.length === maxSize);
  const totalPlayers = answers.length;

  isUnanimous = groups.length === 1 && groups[0].members.length === totalPlayers;
  isChaos = !isUnanimous && (largestGroups.length > 1 || maxSize === 1);

  if (isChaos) {
    randomChaosSips = Math.floor(Math.random() * 5) + 2; // 2-6
    roast = CHAOS_ROASTS[Math.floor(Math.random() * CHAOS_ROASTS.length)];
    for (const a of answers) {
      outcomes.push({ socketId: a.socketId, name: a.name, action: 'drink_now', amount: randomChaosSips });
    }
  } else {
    herdGroup = isUnanimous ? groups[0] : largestGroups[0];
    herdLabel = herdGroup.label;

    // Sort herd members by response time
    const herdMembers = [...herdGroup.members].sort((a, b) => a.responseTime - b.responseTime);
    const outliers = answers.filter(a => !herdGroup.members.find(m => m.socketId === a.socketId));

    // Herd deductions
    herdMembers.forEach((member, i) => {
      const deduct = i === 0 ? 3 : i === 1 ? 2 : 1;
      game.players[member.socketId].sipBank -= deduct;
      outcomes.push({ socketId: member.socketId, name: member.name, action: 'sip_bank_deduct', amount: deduct });
    });

    // Outlier drinking (only if not unanimous)
    if (!isUnanimous) {
      for (const o of outliers) {
        outcomes.push({ socketId: o.socketId, name: o.name, action: 'drink_now', amount: 2 });
      }
    }

    const winnerName = herdMembers[0]?.name || 'Någon';
    const roastFn = ROAST_TEMPLATES[Math.floor(Math.random() * ROAST_TEMPLATES.length)];
    roast = aiGroupingResult?.roast || roastFn(winnerName);
  }
  }

  // Check end-game
  let gameOver = false;
  let winner = null;
  const depleted = Object.entries(game.players).filter(([, p]) => p.sipBank <= 0);
  if (depleted.length > 0) {
    gameOver = true;
    depleted.sort((a, b) => {
      if (a[1].sipBank !== b[1].sipBank) return a[1].sipBank - b[1].sipBank;
      return a[1].totalResponseTime - b[1].totalResponseTime;
    });
    const [winnerId, winnerData] = depleted[0];
    winner = { socketId: winnerId, name: winnerData.name };
    game.status = 'ended';
  }

  // Save to history
  round.groupingResult = { groups, herdLabel, isChaos, isUnanimous };
  round.isChaos = isChaos;
  round.isUnanimous = isUnanimous;
  round.randomChaosSips = randomChaosSips;
  game.roundHistory.push({ prompt: round.prompt, groups, isChaos });
  if (!gameOver) game.status = 'reveal';

  return {
    prompt: round.prompt,
    groups: groups.map(g => ({
      label: g.label,
      members: g.members.map(m => ({ name: m.name, answer: m.text, responseTime: m.responseTime })),
      isHerd: !isChaos && g.label === herdLabel
    })),
    herdLabel,
    isChaos,
    isUnanimous,
    randomChaosSips,
    roast,
    outcomes: outcomes.map(o => ({ name: o.name, action: o.action, amount: o.amount })),
    gameOver,
    winner
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
  game.recentQuestionIds = [];
  game.recentCategories = [];
  game.recentTags = [];
}

function getAllPlayerNames(code) {
  const game = games[code];
  if (!game) return [];
  return Object.values(game.players).map(p => p.name);
}

module.exports = { games, createGame, getGame, addPlayer, removePlayer, startRound, submitAnswer, revealRound, resetGame, getAllPlayerNames, trackQuestion };
