const { QUESTIONS } = require('./questions');

const INTENSITY_ORDER = ['safe', 'spicy', 'chaotic'];
const INTENSITY_WEIGHTS = { safe: 0.5, spicy: 0.3, chaotic: 0.2 };
const STORM_CATEGORIES = ['group', 'drinking', 'embarrassing'];
const STORM_INTENSITY_PRIORITY = ['chaotic', 'spicy', 'safe'];

function pickWeightedIntensity() {
  const r = Math.random();
  if (r < INTENSITY_WEIGHTS.safe) return 'safe';
  if (r < INTENSITY_WEIGHTS.safe + INTENSITY_WEIGHTS.spicy) return 'spicy';
  return 'chaotic';
}

function tagOverlapRatio(tagsA = [], tagsB = []) {
  if (!tagsA.length || !tagsB.length) return 0;
  const setB = new Set(tagsB);
  const overlap = tagsA.filter(t => setB.has(t)).length;
  return overlap / Math.max(tagsA.length, tagsB.length);
}

// Excludes recently used questions and (if the last 2 rounds shared a category) that category
function filterCandidates(pool, recentQuestionIds, recentCategories) {
  const lastTwo = recentCategories.slice(-2);
  const blockedCategory = lastTwo.length === 2 && lastTwo[0] === lastTwo[1] ? lastTwo[0] : null;
  return pool.filter(q => !recentQuestionIds.includes(q.id) && q.category !== blockedCategory);
}

// Prefers the question(s) with the lowest tag overlap vs recently asked questions
function pickByTagDiversity(candidates, recentTagSets) {
  if (!recentTagSets.length) return candidates[Math.floor(Math.random() * candidates.length)];
  const scored = candidates.map(q => ({
    q,
    overlap: Math.max(...recentTagSets.map(rt => tagOverlapRatio(q.tags, rt)))
  }));
  const lowest = Math.min(...scored.map(s => s.overlap));
  const best = scored.filter(s => s.overlap <= lowest + 0.0001);
  return best[Math.floor(Math.random() * best.length)].q;
}

function selectQuestion({ roundNumber = 1, recentQuestionIds = [], recentCategories = [], recentTags = [] }) {
  // Perfect storm rounds: every 7th round, force category pool + intensity priority
  if (roundNumber > 0 && roundNumber % 7 === 0) {
    const stormPool = QUESTIONS.filter(q => STORM_CATEGORIES.includes(q.category));
    for (const intensity of STORM_INTENSITY_PRIORITY) {
      const candidates = filterCandidates(stormPool.filter(q => q.intensity === intensity), recentQuestionIds, recentCategories);
      if (candidates.length) return pickByTagDiversity(candidates, recentTags);
    }
    const anyStorm = stormPool.filter(q => !recentQuestionIds.includes(q.id));
    if (anyStorm.length) return pickByTagDiversity(anyStorm, recentTags);
    return pickByTagDiversity(stormPool, recentTags);
  }

  const intensity = pickWeightedIntensity();
  let candidates = filterCandidates(QUESTIONS.filter(q => q.intensity === intensity), recentQuestionIds, recentCategories);

  if (!candidates.length) {
    // relax the "max 2 same category in a row" rule, still avoid repeats
    candidates = QUESTIONS.filter(q => q.intensity === intensity && !recentQuestionIds.includes(q.id));
  }
  if (!candidates.length) {
    // relax intensity too, just avoid exact repeats
    candidates = QUESTIONS.filter(q => !recentQuestionIds.includes(q.id));
  }
  if (!candidates.length) {
    // pool exhausted (long game) - allow full repeat pool
    candidates = QUESTIONS;
  }

  return pickByTagDiversity(candidates, recentTags);
}

module.exports = { selectQuestion };
