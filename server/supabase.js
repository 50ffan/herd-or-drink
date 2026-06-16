const { createClient } = require('@supabase/supabase-js');

let _client = null;

function getClient() {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) {
      console.warn('Supabase not configured — game results will not be saved.');
      return null;
    }
    _client = createClient(url, key);
  }
  return _client;
}

async function saveGameResult({ gameCode, rounds, players, winner }) {
  const client = getClient();
  if (!client) return;

  try {
    // Insert the game record
    const { data: game, error: gameErr } = await client
      .from('games')
      .insert({ game_code: gameCode, total_rounds: rounds, winner_name: winner?.name || null })
      .select()
      .single();

    if (gameErr) { console.error('Supabase insert game error:', gameErr.message); return; }

    // Insert player results
    const playerRows = players.map(p => ({
      game_id: game.id,
      player_name: p.name,
      sip_bank_remaining: p.sipBank,
      is_winner: p.name === winner?.name
    }));

    const { error: playerErr } = await client.from('game_players').insert(playerRows);
    if (playerErr) console.error('Supabase insert players error:', playerErr.message);

    console.log(`Game ${gameCode} saved to Supabase (id: ${game.id})`);
  } catch (e) {
    console.error('saveGameResult failed:', e.message);
  }
}

module.exports = { saveGameResult };
