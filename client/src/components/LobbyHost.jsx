import socket from '../socket'

export default function LobbyHost({ gameCode, players }) {
  function startGame() {
    socket.emit('start_game')
  }

  return (
    <div className="screen flex-col gap-lg">
      <div className="text-center" style={{ paddingTop: 16 }}>
        <p className="text-muted text-sm" style={{ marginBottom: 8 }}>Spelkod</p>
        <div className="code-display">{gameCode}</div>
        <p className="text-muted text-sm" style={{ marginTop: 8 }}>
          Dela koden med dina vänner
        </p>
      </div>

      <div className="card flex-col gap-md">
        <div className="flex-row" style={{ justifyContent: 'space-between' }}>
          <h3>Spelare</h3>
          <span className="text-muted text-sm">{players.length} st</span>
        </div>
        {players.length === 0 ? (
          <p className="text-muted text-sm text-center" style={{ padding: '16px 0' }}>
            Väntar på spelare...
          </p>
        ) : (
          <div className="flex-col gap-sm">
            {players.map((name, i) => (
              <div key={i} className="player-chip">{name}</div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto">
        <button
          className="btn btn-primary"
          onClick={startGame}
          disabled={players.length < 2}
          style={{ fontSize: '1.2rem', padding: '18px' }}
        >
          Starta spel →
        </button>
        {players.length < 2 && (
          <p className="text-muted text-sm text-center" style={{ marginTop: 8 }}>
            Väntar på minst 2 spelare
          </p>
        )}
      </div>
    </div>
  )
}
