import { useState, useEffect } from 'react'
import { getLeaderboard } from '../supabase'

export default function StatsScreen({ onBack }) {
  const [board, setBoard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLeaderboard().then(data => { setBoard(data); setLoading(false) })
  }, [])

  return (
    <div style={{ width: '100%', paddingTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#888', fontSize: '24px', cursor: 'pointer', padding: '4px' }}>←</button>
        <h2 style={{ fontSize: '22px', fontWeight: 900 }}>🏆 Topplista</h2>
      </div>

      {loading && <p style={{ color: '#888', textAlign: 'center' }}>Laddar...</p>}

      {!loading && board.length === 0 && (
        <div style={{ background: '#16213e', borderRadius: '14px', padding: '32px', textAlign: 'center' }}>
          <p style={{ color: '#888' }}>Inga spel spelade än. Kom igen!</p>
        </div>
      )}

      {!loading && board.map((p, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: i === 0 ? 'rgba(251,191,36,0.1)' : '#16213e',
          border: i === 0 ? '1px solid rgba(251,191,36,0.4)' : '1px solid transparent',
          borderRadius: '12px', padding: '14px 18px', marginBottom: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px', width: '28px', textAlign: 'center' }}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
            </span>
            <div>
              <p style={{ fontWeight: 700, fontSize: '16px' }}>{p.name}</p>
              <p style={{ color: '#888', fontSize: '13px' }}>{p.games} spel spelade</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontWeight: 900, fontSize: '18px', color: '#e94560' }}>{p.wins}</p>
            <p style={{ color: '#888', fontSize: '12px' }}>vinster</p>
          </div>
        </div>
      ))}
    </div>
  )
}
