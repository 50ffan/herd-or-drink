import { useState } from 'react'

const S = {
  card: { background: '#16213e', borderRadius: '14px', padding: '24px', width: '100%', marginTop: '20px' },
  btn: (bg) => ({ display: 'block', width: '100%', background: bg, color: 'white', border: 'none', borderRadius: '10px', padding: '15px', fontSize: '17px', fontWeight: 'bold', cursor: 'pointer', minHeight: '52px', marginTop: '12px' }),
  input: { background: '#0f3460', border: '2px solid #7c3aed', borderRadius: '10px', color: 'white', padding: '13px 16px', fontSize: '16px', width: '100%', marginTop: '8px', outline: 'none', fontFamily: 'inherit' },
}

export default function HomeScreen({ createGame, joinGame }) {
  const [mode, setMode] = useState(null)
  const [joinCode, setJoinCode] = useState('')
  const [joinName, setJoinName] = useState('')

  return (
    <div style={{ width: '100%', paddingTop: '48px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '56px' }}>🐑🍺</div>
        <h1 style={{ fontSize: '38px', fontWeight: 900, marginTop: '10px', color: '#e94560' }}>Herd or Drink</h1>
        <p style={{ color: '#888', marginTop: '8px', fontSize: '16px' }}>Tänk som hjorden – annars dricker du!</p>
      </div>

      {!mode && (
        <>
          <button style={S.btn('#e94560')} onClick={createGame}>🎮 Skapa spel (värd)</button>
          <button style={{ ...S.btn('#7c3aed'), marginTop: '12px' }} onClick={() => setMode('join')}>🔑 Gå med i spel</button>
        </>
      )}

      {mode === 'join' && (
        <div style={S.card}>
          <h2 style={{ fontSize: '20px', color: '#7c3aed', marginBottom: '4px' }}>Gå med i spel</h2>
          <input
            style={{ ...S.input, textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'center', fontSize: '22px' }}
            placeholder="XXXX"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            maxLength={4}
          />
          <input
            style={S.input}
            placeholder="Ditt namn"
            value={joinName}
            onChange={e => setJoinName(e.target.value)}
            maxLength={20}
            onKeyDown={e => e.key === 'Enter' && joinCode.trim().length === 4 && joinName.trim() && joinGame(joinCode.trim(), joinName.trim())}
          />
          <button
            style={{ ...S.btn('#7c3aed'), opacity: (joinCode.trim().length === 4 && joinName.trim()) ? 1 : 0.45 }}
            disabled={joinCode.trim().length < 4 || !joinName.trim()}
            onClick={() => joinGame(joinCode.trim(), joinName.trim())}
          >Gå med 🚀</button>
          <button style={{ ...S.btn('transparent'), border: '1px solid #555', marginTop: '8px' }} onClick={() => setMode(null)}>← Tillbaka</button>
        </div>
      )}
    </div>
  )
}
