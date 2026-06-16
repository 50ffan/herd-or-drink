import { useState, useEffect } from 'react'
import socket from './socket'
import HomeScreen from './components/HomeScreen'
import LobbyHost from './components/LobbyHost'
import LobbyPlayer from './components/LobbyPlayer'
import RoundScreen from './components/RoundScreen'
import RevealScreen from './components/RevealScreen'
import EndScreen from './components/EndScreen'
import StatsScreen from './components/StatsScreen'
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
  const [revealData, setRevealData] = useState(null)
  const [endData, setEndData] = useState(null)
  const [mySocketId, setMySocketId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setMySocketId(socket.id)
    socket.on('connect', () => setMySocketId(socket.id))

    socket.on('game_created', ({ code, name }) => {
      setGameCode(code)
      setIsHost(true)
      if (name) setPlayerName(name)
      setScreen('lobbyHost')
    })

    socket.on('joined_game', ({ code, name }) => {
      setGameCode(code)
      setPlayerName(name)
      setIsHost(false)
      setScreen('lobbyPlayer')
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

  const props = { gameCode, playerName, isHost, players, currentPrompt, roundDuration, roundNumber, revealData, endData, mySocketId }

  return (
    <div className="app">
      {error && <div className="error-toast">{error}</div>}
      {screen === 'home' && <HomeScreen onStats={() => setScreen('stats')} onHowToPlay={() => setScreen('howtoplay')} />}
      {screen === 'howtoplay' && <HowToPlay onBack={() => setScreen('home')} />}
      {screen === 'stats' && <StatsScreen onBack={() => setScreen('home')} />}
      {screen === 'lobbyHost' && <LobbyHost {...props} />}
      {screen === 'lobbyPlayer' && <LobbyPlayer {...props} />}
      {screen === 'round' && <RoundScreen {...props} />}
      {screen === 'reveal' && <RevealScreen {...props} />}
      {screen === 'ended' && <EndScreen {...props} />}
    </div>
  )
}
