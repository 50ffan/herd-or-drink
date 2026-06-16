export default function RevealScreen({ revealData, isHost, nextRound, mySocketId }) {
  if (!revealData) return null

  const { groups, herdLabel, isChaos, isUnanimous, randomChaosSips, roast, outcomes } = revealData

  return (
    <div style={{ width: '100%', paddingTop: '16px' }}>
      <h1 style={{ textAlign: 'center', fontSize: '26px', color: '#e94560', marginBottom: '20px' }}>
        {isChaos ? '🌪️ KAOS!' : isUnanimous ? '🎯 ENHÄLLIGT!' : '🐑 Hjorden har talat!'}
      </h1>

      {isChaos && (
        <div style={{
          background: '#e94560', borderRadius: '12px', padding: '20px',
          textAlign: 'center', marginBottom: '20px', fontSize: '20px', fontWeight: 'bold'
        }}>
          Alla dricker {randomChaosSips} klunkar nu! 🍺
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        {groups.map((group, i) => (
          <div key={i} style={{
            background: '#16213e', borderRadius: '12px', padding: '16px',
            marginBottom: '12px',
            border: group.label === herdLabel && !isChaos ? '2px solid #e94560' : '2px solid transparent'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '18px', color: group.label === herdLabel && !isChaos ? '#e94560' : 'white' }}>
                "{group.label || '(inget svar)'}"
              </span>
              {group.label === herdLabel && !isChaos && (
                <span style={{ background: '#e94560', color: 'white', borderRadius: '4px', padding: '2px 8px', fontSize: '12px' }}>
                  HJORDEN
                </span>
              )}
            </div>
            {group.members.map((m, j) => (
              <div key={j} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '6px 10px', background: '#0f3460',
                borderRadius: '6px', marginBottom: '4px', fontSize: '14px'
              }}>
                <span>👤 {m.name}</span>
                <span style={{ color: '#aaa' }}>{m.responseTime.toFixed(1)}s</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{
        background: '#16213e', borderRadius: '12px', padding: '20px',
        marginBottom: '20px', borderLeft: '4px solid #7c3aed'
      }}>
        <p style={{ color: '#7c3aed', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}>Roast</p>
        <p style={{ fontSize: '16px', fontStyle: 'italic', lineHeight: '1.5' }}>"{roast}"</p>
      </div>

      <div style={{ background: '#16213e', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', color: '#7c3aed', marginBottom: '12px' }}>Resultat</h2>
        {outcomes.map((o, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 12px', background: o.action === 'drink_now' ? 'rgba(233,69,96,0.2)' : 'rgba(124,58,237,0.2)',
            borderRadius: '8px', marginBottom: '8px', fontSize: '15px'
          }}>
            <span>👤 {o.name}</span>
            <span style={{ color: o.action === 'drink_now' ? '#e94560' : '#7c3aed', fontWeight: 'bold' }}>
              {o.action === 'drink_now' ? `Drick ${o.amount} klunkar nu! 🍺` : `−${o.amount} klunkar från banken`}
            </span>
          </div>
        ))}
      </div>

      {isHost ? (
        <button onClick={nextRound} style={{
          width: '100%', background: '#e94560', color: 'white',
          border: 'none', borderRadius: '8px', padding: '16px',
          fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', minHeight: '56px'
        }}>
          Nästa runda ▶️
        </button>
      ) : (
        <div style={{ textAlign: 'center', color: '#aaa', padding: '20px' }}>
          ⏳ Väntar på nästa runda...
        </div>
      )}
    </div>
  )
}
