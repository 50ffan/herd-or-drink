import { useState, useEffect } from 'react'
import socket from '../socket'

export default function RoundScreen({ currentPrompt, roundDuration, roundNumber, alreadyAnswered }) {
  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(!!alreadyAnswered)
  const [timeLeft, setTimeLeft] = useState(roundDuration)

  useEffect(() => {
    setAnswer('')
    setSubmitted(!!alreadyAnswered)
    setTimeLeft(roundDuration)
  }, [currentPrompt, roundDuration])

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

  const urgent = timeLeft <= 5

  return (
    <div className="screen flex-col gap-lg">
      <div className="flex-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="text-muted text-sm">Runda {roundNumber}</span>
        <div className={`timer-ring ${urgent ? 'urgent' : ''}`}>{timeLeft}s</div>
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '1.3rem', fontWeight: 600, lineHeight: 1.4, textAlign: 'center' }}>
          {currentPrompt}
        </p>
      </div>

      {!submitted ? (
        <div className="flex-col gap-md">
          <input
            type="text"
            placeholder="Skriv ditt svar..."
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            disabled={timeLeft === 0}
            maxLength={100}
            autoFocus
          />
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={!answer.trim() || timeLeft === 0}
          >
            Skicka svar →
          </button>
        </div>
      ) : (
        <div className="card text-center animate-pulse" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)' }}>
          <p style={{ color: '#34d399', fontWeight: 600 }}>✅ Svar skickat!</p>
          <p className="text-muted text-sm" style={{ marginTop: 4 }}>Väntar på de andra...</p>
        </div>
      )}
    </div>
  )
}
