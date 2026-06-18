import { useState, useEffect } from 'react'
import socket from './socket'
import HomeScreen from './components/HomeScreen'
import LobbyHost from './components/LobbyHost'
import LobbyPlayer from './components/LobbyPlayer'
import RoundScreen from './components/RoundScreen'
import RevealScreen from './components/RevealScreen'
import EndScreen from './components/EndScreen'
import HowToPlay from './components/HowToPlay'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [gameCode, setGameCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [players, setPlayers] = useState([])
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [roundDuration, setRoundDuration] = useState(25)
  const [roundNumber, setRoundNumber] = useState(0)
  const [alreadyAnswered, setAlreadyAnswered] = useState(false)
  const [revealData, setRevealData] = useState(null)
  const [endData, setEndData] = useState(null)
  const [mySocketId, setMySocketId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setMySocketId(socket.id)
    socket.on('connect', () => {
      setMySocketId(socket.id)
      // After a dropped connection (wifi blip, screen lock), try to resume
      // the game we were in instead of dumping the player back to Home.
      const saved = JSON.parse(localStorage.getItem('gmta_session') || 'null')
      if (saved) socket.emit('rejoin_game', { code: saved.code, name: saved.name })
    })

    socket.on('game_created', ({ code, name }) => {
      setGameCode(code)
      setIsHost(true)
      if (name) setPlayerName(name)
      localStorage.setItem('gmta_session', JSON.stringify({ code, name }))
      setScreen('lobbyHost')
    })

    socket.on('joined_game', ({ code, name }) => {
      setGameCode(code)
      setPlayerName(name)
      setIsHost(false)
      localStorage.setItem('gmta_session', JSON.stringify({ code, name }))
      setScreen('lobbyPlayer')
    })

    socket.on('rejoined', (data) => {
      setGameCode(data.code)
      setPlayerName(data.name)
      setIsHost(data.isHost)
      setPlayers(data.players)
      if (data.status === 'lobby') {
        setScreen(data.isHost ? 'lobbyHost' : 'lobbyPlayer')
      } else if (data.status === 'round') {
        setCurrentPrompt(data.prompt)
        setRoundDuration(data.duration)
        setRoundNumber(data.roundNumber)
        setAlreadyAnswered(!!data.alreadyAnswered)
        setScreen('round')
      } else if (data.status === 'reveal' && data.revealData) {
        setRevealData(data.revealData)
        setScreen('reveal')
      } else if (data.status === 'ended' && data.endData) {
        setEndData(data.endData)
        setScreen('ended')
      }
    })

    socket.on('rejoin_failed', () => {
      localStorage.removeItem('gmta_session')
    })

    socket.on('lobby_update', ({ players }) => {
      setPlayers(players)
    })

    socket.on('game_started', () => {
      setScreen('round')
    })

    socket.on('round_start', ({ prompt, duration, roundNumber: rn }) => {
      setCurrentPrompt(prompt)
      setRoundDuration(duration)
      setRoundNumber(rn || 0)
      setAlreadyAnswered(false)
      setRevealData(null)
      setScreen('round')
    })

    socket.on('round_reveal', (data) => {
      setRevealData(data)
      setScreen('reveal')
    })

    socket.on('game_ended', (data) => {
      setEndData(data)
      setScreen('ended')
    })

    socket.on('back_to_lobby', () => {
      setRevealData(null)
      setEndData(null)
      setScreen(isHost ? 'lobbyHost' : 'lobbyPlayer')
    })

    socket.on('shot_assigned', ({ targetName }) => {
      // handled in EndScreen
    })

    socket.on('error', ({ message }) => {
      setError(message)
      setTimeout(() => setError(''), 4000)
    })

    return () => {
      socket.off('connect')
      socket.off('game_created')
      socket.off('joined_game')
      socket.off('rejoined')
      socket.off('rejoin_failed')
      socket.off('lobby_update')
      socket.off('game_started')
      socket.off('round_start')
      socket.off('round_reveal')
      socket.off('game_ended')
      socket.off('back_to_lobby')
      socket.off('shot_assigned')
      socket.off('error')
    }
  }, [isHost])

  const props = { gameCode, playerName, isHost, players, currentPrompt, roundDuration, roundNumber, alreadyAnswered, revealData, endData, mySocketId }

  return (
    <div className="app">
      {error && <div className="error-toast">{error}</div>}
      {screen === 'home' && <HomeScreen onHowToPlay={() => setScreen('howtoplay')} />}
      {screen === 'howtoplay' && <HowToPlay onBack={() => setScreen('home')} />}
      {screen === 'lobbyHost' && <LobbyHost {...props} />}
      {screen === 'lobbyPlayer' && <LobbyPlayer {...props} />}
      {screen === 'round' && <RoundScreen {...props} />}
      {screen === 'reveal' && <RevealScreen {...props} />}
      {screen === 'ended' && <EndScreen {...props} />}
    </div>
  )
}
