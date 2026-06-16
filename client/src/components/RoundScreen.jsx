import { useState, useEffect } from 'react'
import socket from '../socket'

export default function RoundScreen({ prompt, duration, roundNumber }) {
  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(duration)

  useEffect(() => {
    setAnswer('')
    setSubmitted(false)
    setTimeLeft(duration)
  }, [prompt, duration])

  useEffect(() => {
    if (timeLeft <= 0) return
    const t = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft])

  function submit() {
    if (!answer.trim() || submitted) return
    socket.emit('submit_answer', { text: answer.trim() })
    setSubmitted(true)
  }

  const urgent = timeLeft <= 5 && timeLeft > 0

  return (
    <div style={{ width: '100%', paddingTop: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <span style={{ color: '#888', fontSize: '14px' }}>Runda {roundNumber}</span>
        <div style={{ fontSize: '36px', fontWeight: 900, color: urgent ? '#ff6b6b' : '#e94560', fontVariantNumeric: 'tabular-nums' }}>
          {timeLeft}s
        </div>
      </div>

      <div style={{
        background: '#16213e', borderRadius: '16px', padding: '28px',
        marginBottom: '24px', minHeight: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <p style={{ fontSize: '22px', fontWeight: 600, lineHeight: 1.4, textAlign: 'center' }}>{prompt}</p>
      </div>

      {!submitted ? (
        <>
          <input
            style={{
              display: 'block', width: '100%', background: '#0f3460',
              border: '2px solid #7c3aed', borderRadius: '12px', color: 'white',
              padding: '14px 16px', fontSize: '17px', fontFamily: 'inherit',
              outline: 'none', marginBottom: '12px'
            }}
            placeholder="Skriv ditt svar..."
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            disabled={timeLeft === 0}
            maxLength={100}
            autoFocus
          />
          <button
            onClick={submit}
            disabled={!answer.trim() || timeLeft === 0}
            style={{
              display: 'block', width: '100%', background: '#e94560', color: 'white',
              border: 'none', borderRadius: '12px', padding: '16px', fontSize: '18px',
              fontWeight: 'bold', cursor: 'pointer', minHeight: '54px',
              opacity: (!answer.trim() || timeLeft === 0) ? 0.4 : 1
            }}
          >Skicka svar →</button>
        </>
      ) : (
        <div style={{
          background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)',
          borderRadius: '14px', padding: '24px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>✅</div>
          <p style={{ color: '#34d399', fontWeight: 700, fontSize: '18px' }}>Svar skickat!</p>
          <p style={{ color: '#888', marginTop: '6px', fontSize: '14px' }}>Väntar på de andra...</p>
        </div>
      )}
    </div>
  )
}
