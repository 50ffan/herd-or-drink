import { useState } from 'react'

export default function EndScreen({ endData, isHost, playerName, mySocketId, players, playAgain, assignShot }) {
  const [shotPicked, setShotPicked] = useState(false)

  if (!endData) return null

  const { winner, outcomes } = endData
  const isWinner = winner && (winner.socketId === mySocketId || winner.name === playerName)

  const handleAssignShot = (outcome) => {
    if (shotPicked) return
    setShotPicked(true)
    assignShot(outcome.socketId)
  }

  return (
    <div style={{ width: '100%', paddingTop: '24px', textAlign: 'center' }}>
      <div style={{ fontSize: '64px', marginBottom: '8px' }}>🏆</div>
      <h1 style={{ fontSize: '32px', color: '#e94560', marginBottom: '4px' }}>VINNARE!</h1>
      <p style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '32px' }}>
        🎉 {winner?.name || 'Okänd'} 🎉
      </p>

      {isWinner ? (
        <div style={{ background: '#16213e', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <p style={{ fontSize: '18px', color: '#22c55e', marginBottom: '16px' }}>
            Du vann! Nu väljer du vem som ska ta ett shot 🥃
          </p>
          {!shotPicked ? (
            <div>
              {outcomes
                .filter(o => o.name !== playerName && o.socketId !== mySocketId)
                .map((o, i) => (
                  <button key={i} onClick={() => handleAssignShot(o)} style={{
                    display: 'block', width: '100%', marginBottom: '10px',
                    background: '#e94560', color: 'white', border: 'none',
                    borderRadius: '8px', padding: '14px', fontSize: '16px',
                    cursor: 'pointer', minHeight: '48px'
                  }}>
                    🥃 {o.name} tar ett shot
                  </button>
                ))}
            </div>
          ) : (
            <p style={{ color: '#22c55e', fontSize: '16px' }}>Shot tilldelat! 🥂</p>
          )}
        </div>
      ) : (
        <div style={{ background: '#16213e', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px' }}>😅</div>
          <p style={{ fontSize: '18px', marginTop: '12px', color: '#e94560' }}>
            Du förlorade – drick upp vad som är kvar!
          </p>
        </div>
      )}

      <div style={{ background: '#16213e', borderRadius: '12px', padding: '20px', marginBottom: '24px', textAlign: 'left' }}>
        <h2 style={{ fontSize: '16px', color: '#7c3aed', marginBottom: '12px', textAlign: 'center' }}>
          Slutresultat
        </h2>
        {outcomes && outcomes.map((o, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '10px 12px', background: '#0f3460',
            borderRadius: '8px', marginBottom: '8px', fontSize: '15px'
          }}>
            <span>{o.name === (winner?.name) ? '🏆 ' : '👤 '}{o.name}</span>
          </div>
        ))}
      </div>

      {isHost && (
        <button onClick={playAgain} style={{
          width: '100%', background: '#7c3aed', color: 'white',
          border: 'none', borderRadius: '8px', padding: '16px',
          fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', minHeight: '56px'
        }}>
          Spela igen 🔄
        </button>
      )}
    </div>
  )
}
