import socket from '../socket'

export default function LobbyHost({ gameCode, players }) {
  return (
    <div style={{ width: '100%', paddingTop: '32px' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <p style={{ color: '#888', fontSize: '14px', marginBottom: '6px' }}>Spelkod — dela med dina vänner</p>
        <div style={{ fontSize: '52px', fontWeight: 900, letterSpacing: '0.2em', color: '#e94560' }}>{gameCode}</div>
      </div>

      <div style={{ background: '#16213e', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontWeight: 700 }}>Spelare</span>
          <span style={{ color: '#888', fontSize: '14px' }}>{players.length} st</span>
        </div>
        {players.length === 0
          ? <p style={{ color: '#555', textAlign: 'center', padding: '12px 0' }}>Väntar på spelare...</p>
          : players.map((name, i) => (
            <div key={i} style={{ background: '#0f3460', borderRadius: '8px', padding: '10px 14px', marginBottom: '8px', fontWeight: 600 }}>
              👤 {name}
            </div>
          ))
        }
      </div>

      <div style={{ background: 'rgba(233,69,96,0.1)', border: '1px solid rgba(233,69,96,0.3)', borderRadius: '12px', padding: '14px', marginBottom: '24px', fontSize: '14px', color: '#ffaaaa' }}>
        🎮 Du är värd och spelar inte. Låt spelarna ansluta med koden ovan.
      </div>

      <button
        onClick={() => socket.emit('start_game')}
        disabled={players.length < 1}
        style={{
          display: 'block', width: '100%', background: '#e94560', color: 'white',
          border: 'none', borderRadius: '12px', padding: '18px', fontSize: '19px',
          fontWeight: 'bold', cursor: players.length < 1 ? 'not-allowed' : 'pointer',
          opacity: players.length < 1 ? 0.4 : 1, minHeight: '58px'
        }}
      >
        Starta spel →
      </button>
      {players.length < 2 && <p style={{ textAlign: 'center', color: '#888', fontSize: '13px', marginTop: '8px' }}>Minst 1 spelare behövs</p>}
    </div>
  )
}
