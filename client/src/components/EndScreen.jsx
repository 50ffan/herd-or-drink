import { useState, useEffect } from 'react'
import socket from '../socket'

export default function EndScreen({ endData, isHost, playerName, players }) {
  const [shotPicked, setShotPicked] = useState(false)
  const [shotTarget, setShotTarget] = useState(null)
  const [revealed, setRevealed] = useState([])

  const isWinner = endData?.winner?.name === playerName

  useEffect(() => {
    if (!endData?.finalPlayers) return
    const nonWinners = endData.finalPlayers.filter(p => p.name !== endData.winner?.name)
    nonWinners.forEach((p, i) => {
      setTimeout(() => setRevealed(r => [...r, p.name]), i * 700 + 500)
    })
  }, [endData])

  useEffect(() => {
    socket.on('shot_assigned', ({ targetName }) => setShotTarget(targetName))
    return () => socket.off('shot_assigned')
  }, [])

  function assignShot(targetName) {
    if (shotPicked) return
    setShotPicked(true)
    socket.emit('assign_shot', { targetName })
  }

  function playAgain() {
    socket.emit('play_again')
  }

  if (!endData) return null
  const { winner, finalPlayers } = endData
  const otherPlayers = (finalPlayers || []).filter(p => p.name !== winner?.name)

  return (
    <div style={{ width: '100%', paddingTop: '32px', textAlign: 'center' }}>
      <div style={{ fontSize: '64px', marginBottom: '8px' }}>🏆</div>
      <h1 style={{ fontSize: '36px', color: '#fbbf24', fontWeight: 900 }}>VINNARE!</h1>
      <p style={{ fontSize: '28px', fontWeight: 900, color: '#e94560', marginTop: '6px', marginBottom: '28px' }}>
        🎉 {winner?.name || '?'} 🎉
      </p>

      {shotTarget && (
        <div style={{ background: 'rgba(233,69,96,0.15)', border: '1px solid #e94560', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
          <p style={{ fontSize: '20px', fontWeight: 700 }}>🥃 {winner?.name} ger ett shot till <span style={{ color: '#e94560' }}>{shotTarget}</span>!</p>
        </div>
      )}

      {isWinner && !shotPicked && !shotTarget && otherPlayers.length > 0 && (
        <div style={{ background: '#16213e', borderRadius: '14px', padding: '20px', marginBottom: '20px', textAlign: 'left' }}>
          <p style={{ fontWeight: 700, marginBottom: '14px', color: '#22c55e', fontSize: '16px' }}>
            🎯 Du vann! Välj vem som ska ta ett shot:
          </p>
          {otherPlayers.map((p, i) => (
            <button key={i} onClick={() => assignShot(p.name)} style={{
              display: 'block', width: '100%', background: '#e94560', color: 'white',
              border: 'none', borderRadius: '10px', padding: '14px', fontSize: '16px',
              fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px', minHeight: '50px'
            }}>
              🥃 {p.name} tar ett shot
            </button>
          ))}
        </div>
      )}

      <div style={{ background: '#16213e', borderRadius: '14px', padding: '20px', marginBottom: '24px', textAlign: 'left' }}>
        <h3 style={{ color: '#7c3aed', fontSize: '13px', textTransform: 'uppercase', marginBottom: '14px' }}>Klunkbanken avslöjas</h3>
        {otherPlayers.map((p, i) => (
          <div key={i} style={{
            background: p.name === playerName ? 'rgba(233,69,96,0.15)' : '#0f3460',
            border: p.name === playerName ? '1px solid #e94560' : '1px solid transparent',
            borderRadius: '10px', padding: '14px 16px', marginBottom: '10px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            opacity: revealed.includes(p.name) ? 1 : 0,
            transform: revealed.includes(p.name) ? 'translateY(0)' : 'translateY(12px)',
            transition: 'all 0.5s ease'
          }}>
            <span style={{ fontWeight: 700 }}>{p.name} {p.name === playerName ? '(du)' : ''}</span>
            <span style={{ color: '#ff8585', fontWeight: 900, fontSize: '18px' }}>
              {p.sipBank > 0 ? `Drick ${p.sipBank}! 🍺` : 'Ingen kvar'}
            </span>
          </div>
        ))}
      </div>

      <button onClick={playAgain} style={{
        display: 'block', width: '100%', background: '#7c3aed', color: 'white',
        border: 'none', borderRadius: '12px', padding: '17px', fontSize: '18px',
        fontWeight: 'bold', cursor: 'pointer', minHeight: '56px'
      }}>
        🔄 Spela igen
      </button>
    </div>
  )
}
