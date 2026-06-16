const Anthropic = require('@anthropic-ai/sdk');

let client;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

const FALLBACK_PROMPTS = [
  // Dejting & relationer
  'Vad är det bästa man kan säga för att avsluta ett första dejt?',
  'Vad säger du om du ser ditt ex på ICA?',
  'Vad är den viktigaste egenskapen hos en perfekt partner?',
  'Vad skulle din ex säga om dig?',
  'Vad är det värsta man kan göra på ett första dejt?',
  'Hur vet man att man är kär?',
  'Vad är det bästa sättet att flörta?',
  'Vad är ett deal breaker i ett förhållande?',
  'Vad är det mest romantiska man kan göra?',
  'Hur tar man upp att man vill ha ett förhållande?',
  'Vad är skillnaden mellan kärlek och förälskelse?',
  'Vad gör man om man gillar sin bästa väns ex?',

  // Jobb & vardag
  'Vad är den värsta ursäkten för att komma för sent till jobbet?',
  'Vad är det mest irriterande en kollega kan göra?',
  'Vad är den bästa ursäkten för att hoppa över gymmet?',
  'Vad gör du direkt när du kommer hem från jobbet?',
  'Hur avslutar du ett samtal du vill komma ur?',
  'Vad är det bästa sättet att sluta ett argument?',
  'Vad är det jobbigaste med att bo med någon?',
  'Vad är det bästa med att jobba hemifrån?',
  'Vad gör du när du inte orkar laga mat?',
  'Vad är det värsta med måndagar?',
  'Vad är det bästa med fredagar?',
  'Hur firar du att det är fredag?',

  // Pengar & drömmar
  'Vad skulle du göra om du vann 10 miljoner på lotto?',
  'Vad är det första du köper om du blir rik?',
  'Vilket jobb skulle du ha om lönen inte spelade roll?',
  'Vad är din hemliga talang?',
  'Om du kunde bli expert på något på en dag, vad skulle det vara?',
  'Vad är din drömsemester?',
  'Vilket superkraft skulle du välja?',
  'Om du kunde leva var som helst i världen, var skulle det vara?',
  'Vad är det första du gör om du vaknar upp som miljonär?',
  'Om du kunde tillbringa en dag med vem som helst, levande eller död, vem?',

  // Mat & dryck
  'Vad är det absolut sämsta pizzatoppingen?',
  'Vad är den bästa maten att äta bakfull?',
  'Vad är din hemliga skuldbelagda matnöje?',
  'Vad är den konstiga matkombo du faktiskt gillar?',
  'Vad är det mest överskattade maten?',
  'Vad är din favoriträtt som din mamma lagar?',
  'Vad är det sämsta du någonsin ätit?',
  'Vad är din go-to snacks sent på natten?',
  'Vad skulle du äta till din sista måltid?',

  // Pinsamt & äventyr
  'Vad är den mest pinsamma saken du gjort?',
  'Vad är den hemligaste saken du gör när ingen ser?',
  'Vad är den konstigaste saken du gjort när du var ensam hemma?',
  'Vad är din värsta humleupplevelse?',
  'Vad är det galnaste du gjort för kärlek?',
  'Vad är din mest kaotiska festupplevelse?',
  'Vad är det konstiga du gör som du tror ingen annan gör?',
  'Vad är det mest impulsiva du någonsin gjort?',
  'Vad är din mest genanta missuppfattning?',
  'Vad är det värsta du sagt i ett textmeddelande som gick till fel person?',

  // Sverige & kultur
  'Hur imponerar man på en svensk?',
  'Vad är det mest svenska man kan göra?',
  'Vad säger man på en typisk svensk förfest?',
  'Vad är den bästa sommarminnet från Sverige?',
  'Vad är det mest svenska problemet man kan ha?',
  'Vad är det bästa med svenska sommaren?',
  'Vad är skillnaden mellan en svensk och en utlänning på fest?',
  'Vad äter man på en typisk midsommarfest?',

  // Sociala situationer
  'Vad är det första du gör på en ledig lördag?',
  'Vad är det bästa sättet att ta sig ur en tråkig fest?',
  'Vad gör du om du inte känner någon på en fest?',
  'Vad är det värsta med grupprojekt?',
  'Hur hanterar du en besvärlig granne?',
  'Vad är det bästa ursäkten för att tacka nej till en inbjudan?',
  'Vad är den mest acceptabla lögnen man kan säga?',
  'Hur reagerar du när du glömmer en persons namn?',
  'Vad gör du om du ser en vän kyssa någon annans partner?',
  'Vad är det bästa sättet att avsluta ett tråkigt möte?',

  // Teknik & moderna livet
  'Vad är det första du gör när du vaknar?',
  'Hur lång tid kan du klara dig utan telefonen?',
  'Vad är det mest meningslösa du kollat på YouTube?',
  'Vad är din mest pinsamma Spotify-lyssningshistorik?',
  'Vad är det värsta med sociala medier?',
  'Vad är det bästa med sociala medier?',
  'Hur många appar har du som du aldrig använder?',
  'Vad är din hemliga guilty pleasure-serie?',

  // Djupare frågor (lite spicy)
  'Vad är det mest överskattade aktiviteten?',
  'Vad är det bästa man kan säga när man vill imponera?',
  'Vad är din absoluta gräns i ett förhållande?',
  'Vad är det sista du tänker på innan du somnar?',
  'Vad är din definition av lycka?',
  'Vad är det bästa rådet du fått av dina föräldrar?',
  'Vad är det du ångrar mest?',
  'Vad är något du aldrig berättat för dina föräldrar?',
  'Vad är det mest karaktärsdanande som hänt dig?',
  'Vad är det första du packar inför en resa?',
  'Vad säger man när man är påkommen med att ljuga?',
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
