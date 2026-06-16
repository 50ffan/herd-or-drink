import { useState } from 'react'
import socket from '../socket'

export default function HomeScreen({ onStats, onHowToPlay }) {
  const [mode, setMode] = useState(null) // null | 'create' | 'join'
  const [hostName, setHostName] = useState('')
  const [code, setCode] = useState('')
  const [joinName, setJoinName] = useState('')

  function createGame() {
    if (!hostName.trim()) return
    socket.emit('create_game', { name: hostName.trim() })
  }

  function joinGame() {
    if (!code.trim() || !joinName.trim()) return
    socket.emit('join_game', { code: code.trim().toUpperCase(), name: joinName.trim() })
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
          <button className="btn btn-primary" onClick={() => setMode('create')}>
            🎮 Skapa spel
          </button>
          <button className="btn btn-secondary" onClick={() => setMode('join')}>
            🔑 Gå med i spel
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#888', flex: 1 }} onClick={onHowToPlay}>
              ❓ Hur spelar man?
            </button>
            <button className="btn btn-ghost" style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#888', flex: 1 }} onClick={onStats}>
              📊 Topplista
            </button>
          </div>
        </div>
      )}

      {mode === 'create' && (
        <div className="flex-col gap-md">
          <div className="text-center">
            <h2 style={{ marginBottom: 4 }}>Skapa spel</h2>
            <p className="text-muted text-sm">Du är värd och spelar med!</p>
          </div>
          <div className="flex-col gap-sm">
            <label className="text-sm text-muted">Ditt namn</label>
            <input
              type="text"
              placeholder="Ange ditt namn"
              value={hostName}
              onChange={e => setHostName(e.target.value)}
              maxLength={20}
              onKeyDown={e => e.key === 'Enter' && createGame()}
              autoFocus
            />
          </div>
          <button className="btn btn-primary" onClick={createGame} disabled={!hostName.trim()}>
            Skapa spel →
          </button>
          <button className="btn btn-ghost" onClick={() => setMode(null)}>
            ← Tillbaka
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
              value={joinName}
              onChange={e => setJoinName(e.target.value)}
              maxLength={20}
              onKeyDown={e => e.key === 'Enter' && joinGame()}
            />
          </div>
          <button className="btn btn-primary" onClick={joinGame} disabled={!code.trim() || !joinName.trim()}>
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
