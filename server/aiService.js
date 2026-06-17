const Anthropic = require('@anthropic-ai/sdk');
const { selectQuestion } = require('./questionSelector');

let client;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

// history: { roundNumber, recentQuestionIds, recentCategories, recentTags }
// Returns { id, question, category, intensity, answerType, tags }
async function generatePrompt(history = {}) {
  const { roundNumber = 1, recentQuestionIds = [], recentCategories = [], recentTags = [] } = history;

  if (!process.env.ANTHROPIC_API_KEY) {
    return selectQuestion({ roundNumber, recentQuestionIds, recentCategories, recentTags });
  }

  try {
    const used = recentQuestionIds.length ? `(senaste ${recentQuestionIds.length} frågorna är redan använda, hitta på en ny)` : '(inga)';
    const msg = await getClient().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `Du är spelledare för ett sällskapsspel på svenska. Ge mig EN rolig, öppen fråga på naturlig svenska för vuxna (PG-13). Frågan ska vara lätt att svara på men ge olika svar. Variera tonen (rolig, lite spicy, eller vardaglig). Ge BARA frågan, inget annat.\n\nUndvik upprepning: ${used}\n\nSkriv bara frågan:`
      }]
    });
    const question = msg.content[0].text.trim();
    return { id: null, question, category: 'ai', intensity: 'safe', answerType: 'phrase', tags: [] };
  } catch (e) {
    console.error('generatePrompt failed:', e.message);
    return selectQuestion({ roundNumber, recentQuestionIds, recentCategories, recentTags });
  }
}

async function groupAnswers(answers) {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    const answersText = answers.map(a => `- ${a.name}: "${a.text}" (svarade på ${a.responseTimeSeconds.toFixed(1)}s)`).join('\n');
    const msg = await getClient().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Du analyserar svar i ett sällskapsspel. Steg 1: normalisera svaren mentalt (gemener, ta bort skiljetecken, ignorera stavfel, böjningsformer som singular/plural/presens/preteritum/futurum, och kända synonymer som "donken"="mcdonalds", "mobil"="telefon"). Steg 2: extrahera den underliggande INTENTIONEN bakom varje svar (vad spelaren egentligen menar i sammanhanget) och gruppera svar med SAMMA intention.

Exempel på samma intention (ska grupperas):
- "pizza" / "käkar pizza" / "jag äter pizza ikväll" → samma (pizza)
- "ta bussen" / "åker buss" / "bussen" → samma (buss)
- "gym" / "åka och träna" / "åkte till gymmet" → samma (gymträning)
- "försov mig" / "kommer sent till jobbet" → samma (sen till jobbet)

Var STRIKT med intentionen — gruppera ALDRIG ihop svar som syftar på olika saker bara för att de är tematiskt lika:
- "pizza" och "hamburgare" är OLIKA intentioner (även om båda är mat)
- "kaffe" och "energidricka" är OLIKA intentioner
- "bio" och "fest" är OLIKA intentioner

Hitta "flocken" (störst grupp av samma intention). Skriv en kort rolig roast (max 20 ord, på svenska, med spelarnamn).\n\nSvar:\n${answersText}\n\nSvara BARA med JSON (inga kodblock):\n{\n  "groups": [\n    {\n      "label": "kortfattad gruppetikett",\n      "members": [{"name": "spelarnamn", "text": "deras svar", "responseTime": 1.2, "socketId": ""}]\n    }\n  ],\n  "herdLabel": "etiketten på den största gruppen eller null vid kaos",\n  "roast": "rolig roast på svenska med spelarnamn"\n}`
      }]
    });

    let text = msg.content[0].text.trim();
    // strip markdown fences
    text = text.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
    const parsed = JSON.parse(text);

    // Map socketIds back from names
    const nameToSocket = {};
    for (const a of answers) nameToSocket[a.name] = a.socketId;

    parsed.groups = parsed.groups.map(g => ({
      label: g.label,
      members: g.members.map(m => ({
        socketId: nameToSocket[m.name] || '',
        name: m.name,
        text: m.text,
        responseTime: m.responseTime || 0
      }))
    }));

    return parsed;
  } catch (e) {
    console.error('groupAnswers failed:', e.message);
    return null;
  }
}

module.exports = { generatePrompt, groupAnswers };
