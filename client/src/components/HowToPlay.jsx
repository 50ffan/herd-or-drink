export default function HowToPlay({ onBack }) {
  const steps = [
    {
      icon: '🎮',
      title: 'Skapa eller gå med',
      text: 'En person skapar spelet och delar spelkoden. Alla andra går med via koden. Värden startar spelet när alla är med.'
    },
    {
      icon: '❓',
      title: 'Svara på frågan',
      text: 'Varje runda får alla samma fråga. Du har 25 sekunder på dig att skriva ditt svar. Ju snabbare du svarar, desto bättre!'
    },
    {
      icon: '🐑',
      title: 'Hitta hjorden',
      text: 'AI:n grupperar svaren efter likhet. Den största gruppen är "hjorden". Är du med i hjorden? Bra — du förlorar klunkar från din hemliga klunkbank istället för att dricka nu.'
    },
    {
      icon: '⚡',
      title: 'Snabbhet belönas',
      text: 'I hjorden räknas ordningen:\n🥇 Snabbast → -3 klunkar från banken\n🥈 Näst snabbast → -2 klunkar\n🥉 Resten → -1 klunk'
    },
    {
      icon: '🍺',
      title: 'Utanför hjorden',
      text: 'Svarade du annorlunda än hjorden? Då dricker du 2 klunkar NU direkt — men din klunkbank påverkas inte.'
    },
    {
      icon: '🌀',
      title: 'Kaosrunda',
      text: 'Om alla svarar olika (ingen hjord) är det kaosrunda! Alla dricker ett slumpmässigt antal klunkar (2–6). Skål!'
    },
    {
      icon: '🏆',
      title: 'Vinna spelet',
      text: 'Klunkbanken börjar på 12. Första spelaren vars bank når 0 vinner! Vinnaren får utse vem som ska ta ett shot.'
    },
    {
      icon: '🥃',
      title: 'Slutet',
      text: 'När spelet är slut avslöjas alla klunkbanker. Alla dricker det som är kvar i sin bank. Skål på det!'
    }
  ]

  return (
    <div className="screen flex-col gap-lg" style={{ paddingBottom: 40 }}>
      <div className="flex-row" style={{ alignItems: 'center', gap: 12 }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.5rem', cursor: 'pointer', padding: '4px 8px' }}
        >←</button>
        <h2>Hur spelar man?</h2>
      </div>

      <div className="card" style={{ background: 'rgba(233,69,96,0.1)', border: '1px solid rgba(233,69,96,0.3)' }}>
        <p style={{ fontWeight: 700, color: '#ff8fa3', textAlign: 'center' }}>
          🐑 Tänk som hjorden — annars dricker du! 🍺
        </p>
      </div>

      <div className="flex-col gap-md">
        {steps.map((step, i) => (
          <div key={i} className="card flex-col gap-sm">
            <div className="flex-row gap-sm">
              <span style={{ fontSize: '1.6rem', minWidth: 36 }}>{step.icon}</span>
              <div>
                <p style={{ fontWeight: 700, marginBottom: 4 }}>{step.title}</p>
                <p className="text-muted text-sm" style={{ lineHeight: 1.5, whiteSpace: 'pre-line' }}>{step.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card text-center" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)' }}>
        <p className="text-sm text-purple" style={{ lineHeight: 1.6 }}>
          💡 Klunkbanken är hemlig under spelets gång — ingen vet hur nära noll någon är!
        </p>
      </div>

      <button className="btn btn-primary mt-auto" onClick={onBack}>
        Spela nu! →
      </button>
    </div>
  )
}
