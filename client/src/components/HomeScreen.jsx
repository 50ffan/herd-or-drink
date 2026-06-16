import { useState } from 'react'
import socket from '../socket'

export default function HomeScreen({ onStats }) {
  const [mode, setMode] = useState(null) // null | 'join'
  const [code, setCode] = useState('')
  const [name, setName] = useState('')

  function createGame() {
    socket.emit('create_game')
  }

  function joinGame() {
    if (!code.trim() || !name.trim()) return
    socket.emit('join_game', { code: code.trim().toUpperCase(), name: name.trim() })
  }

  return (
    <div className="screen flex-col gap-lg" style={{ justifyContent: 'center' }}>
      <div className="text-center" style={{ marginBottom: 8 }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 8 }}>🐑🍺</div>
        <h1>Herd or Drink</h1>
        <p className="text-muted" style={{ marginTop: 8, fontSize: '1rem' }}>
          Det svenska sällskapsspelet
        </p>
      </div>

      {!mode && (
        <div className="flex-col gap-md">
          <button className="btn btn-primary" onClick={createGame}>
            🎮 Skapa spel
          </button>
          <button className="btn btn-secondary" onClick={() => setMode('join')}>
            🔑 Gå med i spel
          </button>
          <button className="btn btn-ghost" style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#888', marginTop: '8px' }} onClick={onStats}>
            📊 Topplista
          </button>
        </div>
      )}

      {mode === 'join' && (
        <div className="flex-col gap-md">
          <div className="flex-col gap-sm">
            <label className="text-sm text-muted">Spelkod</label>
            <input
              type="text"
              placeholder="T.ex. ABCD"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              maxLength={4}
              style={{ textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'center', fontSize: '1.5rem' }}
              autoComplete="off"
            />
          </div>
          <div className="flex-col gap-sm">
            <label className="text-sm text-muted">Ditt namn</label>
            <input
              type="text"
              placeholder="Ange ditt namn"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={20}
              onKeyDown={e => e.key === 'Enter' && joinGame()}
            />
          </div>
          <button className="btn btn-primary" onClick={joinGame} disabled={!code.trim() || !name.trim()}>
            Gå med →
          </button>
          <button className="btn btn-ghost" onClick={() => setMode(null)}>
            ← Tillbaka
          </button>
        </div>
      )}
    </div>
  )
}
