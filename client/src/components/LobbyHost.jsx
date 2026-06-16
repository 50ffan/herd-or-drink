import { useState } from 'react'

export default function LobbyHost({ gameCode, players, startGame }) {
  const [copied, setCopied] = useState(false)

  const copyCode = () => {
    navigator.clipboard.writeText(gameCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{ width: '100%', paddingTop: '24px' }}>
      <h1 style={{ textAlign: 'center', color: '#e94560', fontSize: '28px', marginBottom: '24px' }}>
        🎮 Lobby – Du är värden
      </h1>

      <div style={{
        background: '#16213e', borderRadius: '12px', padding: '24px',
        textAlign: 'center', marginBottom: '24px'
      }}>
        <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '8px' }}>Spelkod</p>
        <div style={{
          fontSize: '56px', fontWeight: 'bold', color: '#e94560',
          letterSpacing: '8px', fontFamily: 'monospace'
        }}>
          {gameCode}
        </div>
        <button onClick={copyCode} style={{
          background: copied ? '#22c55e' : '#7c3aed',
          color: 'white', border: 'none', borderRadius: '8px',
          padding: '10px 24px', fontSize: '14px', cursor: 'pointer',
          marginTop: '12px', minHeight: '40px'
        }}>
          {copied ? '✓ Kopierad!' : '📋 Kopiera kod'}
        </button>
      </div>

      <div style={{ background: '#16213e', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '16px', color: '#7c3aed' }}>
          Spelare i lobbyn ({players.length})
        </h2>
        {players.length === 0 ? (
          <p style={{ color: '#aaa' }}>Väntar på spelare...</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {players.map((name, i) => (
              <li key={i} style={{
                padding: '10px 16px', background: '#0f3460',
                borderRadius: '8px', marginBottom: '8px', fontSize: '16px'
              }}>
                👤 {name} {i === 0 ? '(värden)' : ''}
              </li>
            ))}
          </ul>
        )}
      </div>

      {players.length < 2 && (
        <p style={{ textAlign: 'center', color: '#aaa', marginBottom: '12px', fontSize: '14px' }}>
          Minst 2 spelare krävs för att starta
        </p>
      )}

      <button
        onClick={startGame}
        disabled={players.length < 2}
        style={{
          width: '100%', background: players.length >= 2 ? '#e94560' : '#555',
          color: 'white', border: 'none', borderRadius: '8px',
          padding: '16px', fontSize: '20px', fontWeight: 'bold',
          cursor: players.length >= 2 ? 'pointer' : 'not-allowed',
          minHeight: '56px'
        }}
      >
        Starta spel 🚀
      </button>
    </div>
  )
}
