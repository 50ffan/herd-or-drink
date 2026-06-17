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
  'Vad gör man om man gillar sin bästa väns ex?',

  // Spicy & vuxet
  'Nämn en grej folk ljuger om på dejtingappar.',
  'Nämn ett djur som hade haft sämst omdöme på Tinder.',
  'Nämn en plats man absolut inte borde ha sex, trots frestelsen.',
  'Nämn något som garanterat dödar stämningen i sovrummet.',
  'Nämn ett ord som låter helt oskyldigt men blir supersexigt om man säger det rätt.',
  'Nämn en grej man absolut inte vill att partnern hittar i mobilen.',

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
  'Hur firar du att det är fredag?',

  // Pengar & drömmar
  'Vad skulle du göra om du vann 10 miljoner på lotto?',
  'Vad är det första du köper om du blir rik?',
  'Vilket jobb skulle du ha om lönen inte spelade roll?',
  'Vad är din hemliga talang?',
  'Om du kunde bli expert på något på en dag, vad skulle det vara?',
  'Vad är din drömsemester?',
  'Om du kunde leva var som helst i världen, var skulle det vara?',
  'Om du kunde tillbringa en dag med vem som helst, levande eller död, vem?',

  // Superkrafter & tokigt
  'Vilket superkraft skulle du välja?',
  'Nämn en superkraft som i praktiken är helt värdelös.',
  'Nämn ett ljud som garanterat väcker hela huset.',
  'Nämn en grönsak du skulle kasta på någon i ett bråk.',
  'Nämn en plats det vore extremt opassande att ta selfies.',
  'Nämn något pinsamt man kan hitta i någons sökhistorik.',

  // Mat & dryck
  'Vad är det absolut sämsta pizzatoppingen?',
  'Vad är den bästa maten att äta bakfull?',
  'Vad är din hemliga skuldbelagda matnöje?',
  'Vad är den konstigaste matkombo du faktiskt gillar?',
  'Vad är det mest överskattade maten?',
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
  'Vad är det värsta du sagt i ett textmeddelande som gick till fel person?',

  // Sverige & kultur
  'Hur imponerar man på en svensk?',
  'Vad är det mest svenska man kan göra?',
  'Vad säger man på en typisk svensk förfest?',
  'Vad är det mest svenska problemet man kan ha?',
  'Vad är det bästa med svenska sommaren?',
  'Vad är skillnaden mellan en svensk och en utlänning på fest?',
  'Vad äter man på en typisk midsommarfest?',

  // Sociala situationer
  'Vad är det första du gör på en ledig lördag?',
  'Vad är det bästa sättet att ta sig ur en tråkig fest?',
  'Vad gör du om du inte känner någon på en fest?',
  'Hur hanterar du en besvärlig granne?',
  'Vad är den mest acceptabla lögnen man kan säga?',
  'Hur reagerar du när du glömmer en persons namn?',
  'Vad gör du om du ser en vän kyssa någon annans partner?',

  // Teknik & moderna livet
  'Vad är det första du gör när du vaknar?',
  'Hur lång tid kan du klara dig utan telefonen?',
  'Vad är det mest meningslösa du kollat på YouTube?',
  'Vad är din mest pinsamma Spotify-lyssningshistorik?',
  'Vad är det värsta med sociala medier?',
  'Vad är din hemliga guilty pleasure-serie?',

  // Djupare frågor
  'Vad är din absoluta gräns i ett förhållande?',
  'Vad är det sista du tänker på innan du somnar?',
  'Vad är din definition av lycka?',
  'Vad är det bästa rådet du fått av dina föräldrar?',
  'Vad är något du aldrig berättat för dina föräldrar?',
  'Vad är det mest karaktärsdanande som hänt dig?',
  'Vad är det första du packar inför en resa?',
  'Vad säger man när man är påkommen med att ljuga?',

  // Vem i gruppen (majoritetssvar = flocken)
  'Vem i gruppen skulle överleva längst i en zombieapokalyps?',
  'Vem i gruppen skulle klara sig bäst på en öde ö utan teknik?',
  'Vem i gruppen skulle vara bäst på att flörta sig ur en parkeringsbot?',

  // Drickande (roliga bonusrundar)
  'Vem borde ta en shot just nu, ingen anledning behövs?',
  'Vem borde dricka klart sitt glas innan nästa runda?',
  'Vem får dela ut 5 klunkar till valfri person i rummet?',
  'Vem ska ta en shot åt hela gruppen om majoriteten missar denna fråga?',
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function generatePrompt(usedPrompts = []) {
  if (!process.env.ANTHROPIC_API_KEY) {
    const available = FALLBACK_PROMPTS.filter(p => !usedPrompts.includes(p));
    const pool = shuffle(available.length > 0 ? available : FALLBACK_PROMPTS);
    return pool[0];
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
    const pool = shuffle(available.length > 0 ? available : FALLBACK_PROMPTS);
    return pool[0];
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
        content: `Du analyserar svar i ett sällskapsspel. Gruppera dessa svar efter SAMMA underliggande betydelse/sak. Behandla som samma grupp: stavfel, böjningsformer (singular/plural, presens/preteritum/futurum), synonymer, versaler/gemener och svar som syftar på exakt samma sak fast formulerat olika ("pizza" / "äter pizza" / "jag käkar pizza" = samma). Var däremot STRIKT med betydelsen — gruppera ALDRIG ihop svar som syftar på olika saker bara för att de är tematiskt lika (t.ex. "pizza" och "tacos" ska INTE grupperas ihop). Hitta "flocken" (störst grupp). Skriv en kort rolig roast (max 20 ord, på svenska, med spelarnamn).\n\nSvar:\n${answersText}\n\nSvara BARA med JSON (inga kodblock):\n{\n  "groups": [\n    {\n      "label": "kortfattad gruppetikett",\n      "members": [{"name": "spelarnamn", "text": "deras svar", "responseTime": 1.2, "socketId": ""}]\n    }\n  ],\n  "herdLabel": "etiketten på den största gruppen eller null vid kaos",\n  "roast": "rolig roast på svenska med spelarnamn"\n}`
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
