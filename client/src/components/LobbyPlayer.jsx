export default function LobbyPlayer({ playerName, players }) {
  return (
    <div className="screen flex-col gap-lg" style={{ justifyContent: 'center' }}>
      <div className="text-center">
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>⏳</div>
        <h2>Hej, {playerName}!</h2>
        <p className="text-muted" style={{ marginTop: 8 }}>
          Väntar på att värden startar spelet...
        </p>
      </div>

      <div className="card flex-col gap-md">
        <h3>Spelare i lobbyn</h3>
        <div className="flex-col gap-sm">
          {players.map((name, i) => (
            <div key={i} className="player-chip" style={name === playerName ? { borderColor: '#e94560', background: 'rgba(233,69,96,0.2)' } : {}}>
              {name} {name === playerName ? '(du)' : ''}
            </div>
          ))}
        </div>
      </div>

      <div className="card animate-pulse" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', textAlign: 'center' }}>
        <p className="text-sm text-purple">Spelet börjar snart! 🚀</p>
      </div>
    </div>
  )
}
