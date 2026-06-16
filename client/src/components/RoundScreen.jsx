import { useState, useEffect, useRef } from 'react'

export default function RoundScreen({ prompt, duration, submitAnswer, roundNumber }) {
  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(duration)
  const intervalRef = useRef(null)

  useEffect(() => {
    setAnswer('')
    setSubmitted(false)
    setTimeLeft(duration)
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(intervalRef.current); return 0; }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [prompt, duration])

  const handleSubmit = () => {
    if (submitted || !answer.trim()) return
    setSubmitted(true)
    submitAnswer(answer.trim())
  }

  const urgentColor = timeLeft <= 5 ? '#e94560' : timeLeft <= 10 ? '#f59e0b' : '#22c55e'

  return (
    <div style={{ width: '100%', paddingTop: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <span style={{ color: '#aaa', fontSize: '14px' }}>Runda {roundNumber}</span>
        <div style={{
          fontSize: '32px', fontWeight: 'bold', color: urgentColor,
          fontFamily: 'monospace', minWidth: '60px', textAlign: 'right'
        }}>
          {timeLeft}s
        </div>
      </div>

      <div style={{
        background: '#16213e', borderRadius: '12px', padding: '24px',
        marginBottom: '24px', textAlign: 'center'
      }}>
        <p style={{ color: '#7c3aed', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
          Frågan är:
        </p>
        <p style={{ fontSize: '22px', fontWeight: 'bold', lineHeight: '1.4' }}>
          {prompt}
        </p>
      </div>

      {submitted ? (
        <div style={{
          background: '#16213e', borderRadius: '12px', padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px' }}>✅</div>
          <p style={{ fontSize: '18px', marginTop: '12px', color: '#22c55e' }}>
            Svar skickat!
          </p>
          <p style={{ color: '#aaa', marginTop: '8px' }}>
            Väntar på de andra...
          </p>
        </div>
      ) : (
        <div>
          <textarea
            style={{
              background: '#16213e', border: '2px solid #7c3aed',
              borderRadius: '8px', color: 'white', padding: '14px 16px',
              fontSize: '16px', width: '100%', resize: 'none', height: '100px',
              outline: 'none'
            }}
            placeholder="Skriv ditt svar..."
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())}
            disabled={timeLeft === 0}
          />
          <button
            onClick={handleSubmit}
            disabled={!answer.trim() || timeLeft === 0}
            style={{
              width: '100%', marginTop: '12px',
              background: answer.trim() && timeLeft > 0 ? '#e94560' : '#555',
              color: 'white', border: 'none', borderRadius: '8px',
              padding: '16px', fontSize: '18px', fontWeight: 'bold',
              cursor: answer.trim() && timeLeft > 0 ? 'pointer' : 'not-allowed',
              minHeight: '56px'
            }}
          >
            Skicka svar 📨
          </button>
          {timeLeft === 0 && (
            <p style={{ textAlign: 'center', color: '#e94560', marginTop: '12px' }}>
              Tiden är ute!
            </p>
          )}
        </div>
      )}
    </div>
  )
}
