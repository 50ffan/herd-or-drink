// Layer 1: normalization (safe preprocessing — cleans text, does not decide meaning)

const SYNONYMS = {
  donken: 'mcdonalds',
  mcdonalds: 'mcdonalds',
  "mcdonald's": 'mcdonalds',
  tv: 'tv',
  teve: 'tv',
  mobil: 'telefon',
  telefon: 'telefon',
  köttbulle: 'köttbullar',
  köttbullar: 'köttbullar',
  burgare: 'hamburgare',
  hamburgare: 'hamburgare',
  cheeseburgare: 'hamburgare',
  bil: 'bil',
  bilen: 'bil',
  kompis: 'vän',
  kompisar: 'vän',
  vän: 'vän',
  vänner: 'vän',
};

// Crude Swedish inflectional-suffix stripper (good enough for short party-game answers)
function lemmatize(word) {
  const suffixes = ['arna', 'erna', 'orna', 'ornas', 'arnas', 'erna', 'arna', 'ar', 'or', 'er', 'en', 'et', 'na', 'a', 's'];
  for (const suf of suffixes) {
    if (word.length > suf.length + 2 && word.endsWith(suf)) {
      return word.slice(0, -suf.length);
    }
  }
  return word;
}

function stripPunctuation(s) {
  return s.replace(/[.,!?;:'"()\-–—]/g, '');
}

// Lowercase + punctuation/whitespace cleanup + synonyms, WITHOUT lemmatization.
// Used for intent-pattern matching, where stripping suffixes would break word boundaries.
function lightNormalize(text) {
  let t = (text || '').toLowerCase().trim();
  t = stripPunctuation(t);
  t = t.replace(/\s+/g, ' ');
  const words = t.split(' ').filter(Boolean).map(w => SYNONYMS[w] || w);
  return words.join(' ');
}

function normalize(text) {
  const t = lightNormalize(text);
  const words = t.split(' ').filter(Boolean).map(w => SYNONYMS[w] || lemmatize(w));
  return words.join(' ');
}

// Layer 2 (deterministic subset): a small set of strict, specific intent patterns
// used only by the no-API-key fallback grouping. Intentionally narrow — over-grouping
// (e.g. merging pizza and burger) is worse than under-grouping for fairness.
const INTENT_PATTERNS = [
  { intent: 'pizza_food', re: /\bpizz\w*\b/ },
  { intent: 'burger_food', re: /\b(hamburgare|burgare)\w*\b/ },
  { intent: 'bus_transport', re: /\bbuss\w*\b/ },
  { intent: 'gym_activity', re: /\b(gym\w*|trän\w*)\b/ },
  { intent: 'late_work', re: /\b(försov|sent till jobbet|kom sent)\b/ },
  { intent: 'mcdonalds_food', re: /\b(mcdonalds|donken)\b/ },
];

// Runs on the lightly-normalized (non-lemmatized) text so word stems stay intact
function extractIntent(text) {
  const light = lightNormalize(text);
  for (const p of INTENT_PATTERNS) {
    if (p.re.test(light)) return p.intent;
  }
  return null;
}

// Levenshtein-based fuzzy similarity (0..1), used as the last-resort matching layer
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

function similarity(a, b) {
  if (!a.length && !b.length) return 1;
  return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

module.exports = { normalize, extractIntent, similarity };
