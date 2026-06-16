export default function LobbyPlayer({ gameCode, playerName, players }) {
  return (
    <div style={{ width: '100%', paddingTop: '48px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
      <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Hej, {playerName}!</h2>
      <p style={{ color: '#888', marginBottom: '32px' }}>Spelkod: <strong style={{ color: '#e94560' }}>{gameCode}</strong></p>
      <p style={{ color: '#aaa' }}>Väntar på att värden startar spelet...</p>

      {players.length > 0 && (
        <div style={{ background: '#16213e', borderRadius: '14px', padding: '20px', marginTop: '28px', textAlign: 'left' }}>
          <h3 style={{ color: '#7c3aed', marginBottom: '12px', fontSize: '14px', textTransform: 'uppercase' }}>Spelare i lobbyn</h3>
          {players.map((name, i) => (
            <div key={i} style={{
              background: name === playerName ? 'rgba(233,69,96,0.2)' : '#0f3460',
              border: name === playerName ? '1px solid #e94560' : '1px solid transparent',
              borderRadius: '8px', padding: '10px 14px', marginBottom: '8px', fontWeight: 600
            }}>
              {name === playerName ? '⭐ ' : '👤 '}{name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
