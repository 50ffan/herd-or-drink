export default function LobbyPlayer({ gameCode, playerName, players }) {
  return (
    <div style={{ width: '100%', paddingTop: '24px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
      <h1 style={{ color: '#e94560', fontSize: '24px', marginBottom: '8px' }}>
        Väntar på att värden startar spelet...
      </h1>
      <p style={{ color: '#aaa', marginBottom: '24px' }}>
        Du spelar som <strong style={{ color: 'white' }}>{playerName}</strong>
      </p>

      <div style={{ background: '#16213e', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
        <p style={{ color: '#aaa', fontSize: '14px' }}>Spelkod</p>
        <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#e94560', letterSpacing: '4px', fontFamily: 'monospace' }}>
          {gameCode}
        </div>
      </div>

      <div style={{ background: '#16213e', borderRadius: '12px', padding: '20px' }}>
        <h2 style={{ fontSize: '16px', color: '#7c3aed', marginBottom: '12px' }}>
          Spelare ({players.length})
        </h2>
        {players.map((name, i) => (
          <div key={i} style={{
            padding: '10px 16px', background: '#0f3460',
            borderRadius: '8px', marginBottom: '8px', fontSize: '15px'
          }}>
            👤 {name}
          </div>
        ))}
      </div>
    </div>
  )
}
