const Anthropic = require('@anthropic-ai/sdk');

let client;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

const FALLBACK_PROMPTS = [
  'Vad är det bästa man kan säga för att avsluta ett första dejt?',
  'Vad skulle du göra om du vann 10 miljoner på lotto?',
  'Vad är den värsta ursäkten för att komma för sent till jobbet?',
  'Vad är det första du gör på en ledig lördag?',
  'Vad är det absolut sämsta pizzatoppingen?',
  'Vad säger man när man är påkommen med att ljuga?',
  'Vad är det bästa sättet att sluta ett argument?',
  'Vad är den mest överskattade aktiviteten?',
  'Vad skulle din ex säga om dig?',
  'Vad är det första du packar inför en resa?',
  'Vad är det mest irriterande en kollega kan göra?',
  'Hur imponerar man på en svensk?',
  'Vad säger du om du ser ditt ex på ICA?',
  'Vad är den bästa ursäkten för att hoppa över gymmet?',
  'Vad är det viktigaste egenskapen hos en perfekt partner?',
  'Vad gör du direkt när du kommer hem från jobbet?',
  'Vad är den hemligaste saken du gör när ingen ser?',
  'Hur avslutar du ett samtal du vill komma ur?',
];

let promptIndex = 0;

async function generatePrompt(usedPrompts = []) {
  if (!process.env.ANTHROPIC_API_KEY) {
    // fallback: rotate through list
    const available = FALLBACK_PROMPTS.filter(p => !usedPrompts.includes(p));
    const pool = available.length > 0 ? available : FALLBACK_PROMPTS;
    const p = pool[promptIndex % pool.length];
    promptIndex++;
    return p;
  }

  try {
    const used = usedPrompts.slice(-10).join('\n');
    const msg = await getClient().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `Du är spelledare för ett sällskapsspel på svenska. Ge mig EN rolig, öppen fråga på naturlig svenska för vuxna (PG-13). Frågan ska vara lätt att svara på men ge olika svar. Variera tonen (rolig, lite spicy, eller vardaglig). Ge BARA frågan, inget annat.\n\nUndvik dessa frågor som redan använts:\n${used || '(inga)'}\n\nSkriv bara frågan:`
      }]
    });
    return msg.content[0].text.trim();
  } catch (e) {
    console.error('generatePrompt failed:', e.message);
    const available = FALLBACK_PROMPTS.filter(p => !usedPrompts.includes(p));
    const pool = available.length > 0 ? available : FALLBACK_PROMPTS;
    const p = pool[promptIndex % pool.length];
    promptIndex++;
    return p;
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
        content: `Du analyserar svar i ett sällskapsspel. Gruppera dessa svar efter likhet (ignorera stavfel, synonymer, singular/plural, versaler). Hitta "hjorden" (störst grupp). Skriv en kort rolig roast (max 20 ord, på svenska, med spelarnamn).\n\nSvar:\n${answersText}\n\nSvara BARA med JSON (inga kodblock):\n{\n  "groups": [\n    {\n      "label": "kortfattad gruppetikett",\n      "members": [{"name": "spelarnamn", "text": "deras svar", "responseTime": 1.2, "socketId": ""}]\n    }\n  ],\n  "herdLabel": "etiketten på den största gruppen eller null vid kaos",\n  "roast": "rolig roast på svenska med spelarnamn"\n}`
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
