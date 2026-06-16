import { useState, useEffect } from 'react'
import socket from './socket'
import HomeScreen from './components/HomeScreen'
import LobbyHost from './components/LobbyHost'
import LobbyPlayer from './components/LobbyPlayer'
import RoundScreen from './components/RoundScreen'
import RevealScreen from './components/RevealScreen'
import EndScreen from './components/EndScreen'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [gameCode, setGameCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [players, setPlayers] = useState([])
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [roundDuration, setRoundDuration] = useState(25)
  const [revealData, setRevealData] = useState(null)
  const [endData, setEndData] = useState(null)
  const [mySocketId, setMySocketId] = useState('')
  const [roundNumber, setRoundNumber] = useState(0)
  const [shotNotice, setShotNotice] = useState('')

  useEffect(() => {
    socket.on('connect', () => setMySocketId(socket.id))

    socket.on('game_created', ({ code }) => {
      setGameCode(code)
      setIsHost(true)
      setScreen('lobbyHost')
    })

    socket.on('joined_game', ({ code, name }) => {
      setGameCode(code)
      setScreen('lobbyPlayer')
    })

    socket.on('lobby_update', ({ players }) => {
      setPlayers(players)
    })

    socket.on('play_again_reset', () => {
      setScreen(prev => {
        return isHost ? 'lobbyHost' : 'lobbyPlayer'
      })
      setRevealData(null)
      setEndData(null)
      setRoundNumber(0)
    })

    socket.on('game_started', () => {
      setScreen('round')
      setRoundNumber(0)
    })

    socket.on('round_start', ({ prompt, duration, roundNumber: rn }) => {
      setCurrentPrompt(prompt)
      setRoundDuration(duration)
      setRoundNumber(rn)
      setRevealData(null)
      setScreen('round')
    })

    socket.on('round_reveal', (data) => {
      setRevealData(data)
      if (data.gameOver) {
        setEndData(data)
        setScreen('ended')
      } else {
        setScreen('reveal')
      }
    })

    socket.on('game_ended', (data) => {
      setEndData(data)
      setScreen('ended')
    })

    socket.on('shot_assigned', ({ targetName }) => {
      setShotNotice(`${targetName} ska ta ett shot! 🥃`)
    })

    socket.on('error', ({ message }) => {
      alert(message)
    })

    return () => {
      socket.off('connect')
      socket.off('game_created')
      socket.off('joined_game')
      socket.off('lobby_update')
      socket.off('play_again_reset')
      socket.off('game_started')
      socket.off('round_start')
      socket.off('round_reveal')
      socket.off('game_ended')
      socket.off('shot_assigned')
      socket.off('error')
    }
  }, [isHost])

  const createGame = (name) => {
    setPlayerName(name)
    socket.emit('create_game', { name })
  }

  const joinGame = (code, name) => {
    setPlayerName(name)
    socket.emit('join_game', { code, name })
  }

  const startGame = () => socket.emit('start_game')
  const submitAnswer = (text) => socket.emit('submit_answer', { text })
  const nextRound = () => socket.emit('next_round')
  const playAgain = () => socket.emit('play_again')
  const assignShot = (targetSocketId) => socket.emit('assign_shot', { targetSocketId })

  const containerStyle = {
    minHeight: '100vh',
    background: '#1a1a2e',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px',
    maxWidth: '600px',
    margin: '0 auto'
  }

  return (
    <div style={containerStyle}>
      {shotNotice && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '24px'
        }}>
          <div style={{
            background: '#16213e', borderRadius: '16px', padding: '32px',
            textAlign: 'center', maxWidth: '400px'
          }}>
            <div style={{ fontSize: '64px' }}>🥃</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '16px', color: '#e94560' }}>
              {shotNotice}
            </div>
            <button onClick={() => setShotNotice('')} style={{
              marginTop: '24px', background: '#e94560', color: 'white',
              border: 'none', borderRadius: '8px', padding: '12px 32px',
              fontSize: '16px', cursor: 'pointer', minHeight: '48px'
            }}>OK</button>
          </div>
        </div>
      )}

      {screen === 'home' && <HomeScreen createGame={createGame} joinGame={joinGame} />}
      {screen === 'lobbyHost' && <LobbyHost gameCode={gameCode} players={players} startGame={startGame} />}
      {screen === 'lobbyPlayer' && <LobbyPlayer gameCode={gameCode} playerName={playerName} players={players} />}
      {screen === 'round' && <RoundScreen prompt={currentPrompt} duration={roundDuration} submitAnswer={submitAnswer} roundNumber={roundNumber} />}
      {screen === 'reveal' && <RevealScreen revealData={revealData} isHost={isHost} nextRound={nextRound} mySocketId={mySocketId} />}
      {screen === 'ended' && <EndScreen endData={endData} isHost={isHost} playerName={playerName} mySocketId={mySocketId} players={players} playAgain={playAgain} assignShot={assignShot} />}
    </div>
  )
}
