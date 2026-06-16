import { useState } from 'react'

const btn = {
  background: '#e94560',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  padding: '14px 24px',
  fontSize: '18px',
  fontWeight: 'bold',
  cursor: 'pointer',
  minHeight: '52px',
  width: '100%',
  marginTop: '12px'
}

const input = {
  background: '#16213e',
  border: '2px solid #7c3aed',
  borderRadius: '8px',
  color: 'white',
  padding: '12px 16px',
  fontSize: '16px',
  width: '100%',
  marginTop: '8px',
  outline: 'none'
}

const card = {
  background: '#16213e',
  borderRadius: '12px',
  padding: '24px',
  width: '100%',
  marginTop: '24px'
}

export default function HomeScreen({ createGame, joinGame }) {
  const [createName, setCreateName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joinName, setJoinName] = useState('')
  const [showJoin, setShowJoin] = useState(false)

  return (
    <div style={{ width: '100%', paddingTop: '40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '48px' }}>🐑🍺</div>
        <h1 style={{ fontSize: '36px', fontWeight: 'black', marginTop: '8px', color: '#e94560' }}>
          Herd or Drink
        </h1>
        <p style={{ color: '#aaa', marginTop: '8px', fontSize: '16px' }}>
          Tänk som hjorden – annars dricker du!
        </p>
      </div>

      <div style={card}>
        <h2 style={{ fontSize: '20px', marginBottom: '8px', color: '#7c3aed' }}>Skapa spel</h2>
        <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '8px' }}>Du blir värden.</p>
        <input
          style={input}
          placeholder="Ditt namn"
          value={createName}
          onChange={e => setCreateName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createName.trim() && createGame(createName.trim())}
        />
        <button
          style={{ ...btn, opacity: createName.trim() ? 1 : 0.5 }}
          disabled={!createName.trim()}
          onClick={() => createGame(createName.trim())}
        >
          Skapa spel 🎮
        </button>
      </div>

      <div style={card}>
        <h2 style={{ fontSize: '20px', marginBottom: '8px', color: '#7c3aed' }}>Gå med i spel</h2>
        {!showJoin ? (
          <button style={{ ...btn, background: '#7c3aed' }} onClick={() => setShowJoin(true)}>
            Gå med i spel 🚀
          </button>
        ) : (
          <>
            <input
              style={input}
              placeholder="Spelkod (4 tecken)"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={4}
            />
            <input
              style={input}
              placeholder="Ditt namn"
              value={joinName}
              onChange={e => setJoinName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && joinCode.trim() && joinName.trim() && joinGame(joinCode.trim(), joinName.trim())}
            />
            <button
              style={{ ...btn, background: '#7c3aed', opacity: (joinCode.trim() && joinName.trim()) ? 1 : 0.5 }}
              disabled={!joinCode.trim() || !joinName.trim()}
              onClick={() => joinGame(joinCode.trim(), joinName.trim())}
            >
              Gå med 🚀
            </button>
          </>
        )}
      </div>
    </div>
  )
}
