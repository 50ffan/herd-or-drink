import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = (url && key) ? createClient(url, key) : null

export async function getLeaderboard(limit = 10) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('game_players')
    .select('player_name, is_winner, game_id')
    .order('created_at', { ascending: false })
  if (error) { console.error(error); return [] }

  // Count wins per player
  const stats = {}
  for (const row of data) {
    if (!stats[row.player_name]) stats[row.player_name] = { name: row.player_name, wins: 0, games: 0 }
    stats[row.player_name].games++
    if (row.is_winner) stats[row.player_name].wins++
  }

  return Object.values(stats)
    .sort((a, b) => b.wins - a.wins || b.games - a.games)
    .slice(0, limit)
}

export async function getPlayerStats(name) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('game_players')
    .select('is_winner, sip_bank_remaining, created_at')
    .eq('player_name', name)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) { console.error(error); return null }
  const wins = data.filter(r => r.is_winner).length
  return { name, games: data.length, wins, recent: data }
}
