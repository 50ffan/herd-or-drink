import { useState, useEffect } from 'react'
import socket from '../socket'

export default function EndScreen({ endData, playerName, mySocketId, players }) {
  const [shotTarget, setShotTarget] = useState(null)
  const [shotAssigned, setShotAssigned] = useState(null)
  const [revealed, setRevealed] = useState([])

  const isWinner = endData?.winner?.name === playerName

  useEffect(() => {
    if (!endData) return
    // Stagger reveal of non-winners
    const nonWinners = endData.finalPlayers.filter(p => p.name !== endData.winner?.name)
    nonWinners.forEach((p, i) => {
      setTimeout(() => setRevealed(r => [...r, p.name]), i * 600 + 400)
    })
  }, [endData])

  useEffect(() => {
    socket.on('shot_assigned', ({ targetName }) => setShotAssigned(targetName))
    return () => socket.off('shot_assigned')
  }, [])

  function assignShot(targetName) {
    socket.emit('assign_shot', { targetName })
    setShotTarget(targetName)
  }

  function playAgain() {
    socket.emit('play_again')
  }

  if (!endData) return null

  const { winner, finalPlayers } = endData
  const otherPlayers = players.filter(name => name !== winner?.name)

  return (
    <div className="screen flex-col gap-lg text-center" style={{ paddingBottom: 32 }}>
      <div className="animate-winner">
        <div style={{ fontSize: '4rem', marginBottom: 8 }}>🏆</div>
        <h1 style={{ color: '#fbbf24' }}>VINNARE!</h1>
        <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#e94560', marginTop: 8 }}>
          {winner?.name}
        </p>
      </div>

      {isWinner && !shotAssigned && (
        <div className="card flex-col gap-md" style={{ background: 'rgba(233,69,96,0.15)', border: '1px solid #e94560' }}>
          <p style={{ fontWeight: 700 }}>🎯 Du vann! Välj vem som ska ta ett shot:</p>
          <div className="flex-col gap-sm">
            {otherPlayers.map((name, i) => (
              <button key={i} className="btn btn-outline" onClick={() => assignShot(name)}>
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {shotAssigned && (
        <div className="card" style={{ background: 'rgba(233,69,96,0.1)', border: '1px solid rgba(233,69,96,0.4)' }}>
          <p style={{ fontWeight: 700, color: '#fbbf24' }}>
            🥃 {winner?.name} ger ett shot till {shotAssigned}!
          </p>
        </div>
      )}

      {!isWinner && (
        <div className="flex-col gap-md">
          <h3>Klunkbanken avslöjas...</h3>
          {finalPlayers
            .filter(p => p.name !== winner?.name)
            .map((p, i) => (
              <div
                key={i}
                className="card"
                style={{
                  opacity: revealed.includes(p.name) ? 1 : 0,
                  transform: revealed.includes(p.name) ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'all 0.5s ease',
                  background: p.name === playerName ? 'rgba(233,69,96,0.15)' : 'rgba(255,255,255,0.06)'
                }}
              >
                <p style={{ fontWeight: 700 }}>{p.name} {p.name === playerName ? '(du)' : ''}</p>
                <p className="text-accent" style={{ fontSize: '1.4rem', fontWeight: 900, marginTop: 4 }}>
                  {p.sipBank > 0 ? `Drick ${p.sipBank} klunkar! 🍺` : 'Ingen kvar!'}
                </p>
              </div>
            ))}
        </div>
      )}

      <button className="btn btn-secondary mt-auto" onClick={playAgain} style={{ marginTop: 16 }}>
        🔄 Spela igen
      </button>
    </div>
  )
}
