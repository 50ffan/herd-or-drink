import socket from '../socket'

export default function RevealScreen({ revealData, isHost, playerName }) {
  if (!revealData) return null

  const { groups, herdLabel, isChaos, isUnanimous, randomChaosSips, roast, outcomes, gameOver } = revealData

  function nextRound() {
    socket.emit('next_round')
  }

  return (
    <div className="screen flex-col gap-lg" style={{ paddingBottom: 32 }}>
      <h2 style={{ textAlign: 'center' }}>
        {isChaos ? '🌀 Kaosrunda!' : isUnanimous ? '🐑 Alla tänkte likadant!' : '🏆 Avslöjandet'}
      </h2>

      {isChaos && (
        <div className="card text-center" style={{ background: 'rgba(233,69,96,0.15)', border: '1px solid #e94560' }}>
          <p className="text-2xl animate-pulse" style={{ color: '#e94560', fontWeight: 900 }}>
            KAOS! Alla dricker {randomChaosSips} klunkar!
          </p>
        </div>
      )}

      <div className="card" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)' }}>
        <p style={{ fontStyle: 'italic', color: '#c4b5fd', fontSize: '1rem', lineHeight: 1.5 }}>
          💬 "{roast}"
        </p>
      </div>

      <div className="flex-col gap-md">
        <h3>Grupper</h3>
        {groups.map((group, i) => (
          <div key={i} className="card flex-col gap-sm">
            <div className="flex-row gap-sm" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700 }}>{group.label}</span>
              {group.isHerd && <span className="herd-badge">🐑 Flocken</span>}
            </div>
            <div className="flex-col gap-sm" style={{ marginTop: 4 }}>
              {group.members.map((m, j) => (
                <div key={j} className="flex-row" style={{ justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ fontWeight: 600 }}>{m.name}</span>
                  <span className="text-muted">"{m.answer}" · {m.responseTime?.toFixed(1)}s</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-col gap-md">
        <h3>Utfall</h3>
        {outcomes.map((o, i) => (
          <div key={i} className="card flex-row" style={{ justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600 }}>{o.name} {o.name === playerName ? '(du)' : ''}</span>
            {o.action === 'drink_now' ? (
              <span className="outcome-drink">🍺 Drick {o.amount} nu!</span>
            ) : (
              <span className="outcome-sip">-{o.amount} från sipbank ✓</span>
            )}
          </div>
        ))}
      </div>

      {isHost && !gameOver && (
        <button className="btn btn-primary mt-auto" onClick={nextRound} style={{ marginTop: 16 }}>
          Nästa runda →
        </button>
      )}
      {!isHost && !gameOver && (
        <p className="text-muted text-sm text-center mt-auto" style={{ marginTop: 16 }}>
          Väntar på att värden startar nästa runda...
        </p>
      )}
      {gameOver && (
        <div className="card text-center animate-pulse" style={{ background: 'rgba(233,69,96,0.1)' }}>
          <p className="text-accent font-bold">Spelet är slut! Avslöjandet kommer...</p>
        </div>
      )}
    </div>
  )
}
