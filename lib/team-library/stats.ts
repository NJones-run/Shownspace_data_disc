import { createServerSupabaseClient } from "@/lib/supabase/client";
import { assertTeamAccess, listPlayers } from "@/lib/team-library/server";

type PlayerRow = {
  player_id: string;
  first_name: string;
  last_name: string;
  jersey_number?: string | null;
};

type ManualGameRow = {
  session_id: string;
  GameID: string;
  opponent_name?: string | null;
  game_date?: string | null;
  tournament_name?: string | null;
};

type ManualEventRow = {
  session_id: string;
  event_type: string;
  actor_player_id?: string | null;
  target_player_id?: string | null;
};

export interface TeamStatsGame {
  sessionId: string;
  gameId: string;
  label: string;
  opponentName?: string;
  gameDate?: string;
  tournamentName?: string;
}

export interface PlayerStatsRow {
  playerId: string;
  playerName: string;
  jerseyNumber?: string;
  games: number;
  totalEvents: number;
  throws: number;
  completions: number;
  receptions: number;
  goals: number;
  drops: number;
  blocks: number;
  turnovers: number;
  pulls: number;
  tippedSelfCatches: number;
  penalties: number;
}

function createEmptyStats(player: PlayerRow): PlayerStatsRow {
  const jerseyNumber = player.jersey_number ? String(player.jersey_number) : undefined;
  return {
    playerId: String(player.player_id),
    playerName: `${player.first_name}${player.last_name ? ` ${player.last_name}` : ""}`,
    jerseyNumber,
    games: 0,
    totalEvents: 0,
    throws: 0,
    completions: 0,
    receptions: 0,
    goals: 0,
    drops: 0,
    blocks: 0,
    turnovers: 0,
    pulls: 0,
    tippedSelfCatches: 0,
    penalties: 0
  };
}

function gameLabel(game: ManualGameRow) {
  const parts = [game.game_date, game.opponent_name ? `vs ${game.opponent_name}` : undefined, game.tournament_name].filter(Boolean);
  return parts.length ? parts.join(" · ") : game.GameID;
}

function incrementPlayerEvent(stats: PlayerStatsRow, eventType: string) {
  stats.totalEvents += 1;
  if (eventType === "throw") {
    stats.throws += 1;
    stats.completions += 1;
  } else if (eventType === "goal") {
    stats.goals += 1;
  } else if (eventType === "drop") {
    stats.drops += 1;
  } else if (eventType === "block") {
    stats.blocks += 1;
  } else if (eventType === "turnover") {
    stats.turnovers += 1;
  } else if (eventType === "pull") {
    stats.pulls += 1;
  } else if (eventType === "tipped_self_catch") {
    stats.tippedSelfCatches += 1;
  } else if (eventType === "penalty") {
    stats.penalties += 1;
  }
}

export async function getTeamPlayerStats(teamId: string, sessionId: string | undefined, userId: string | undefined, scorerTokens: string[]) {
  await assertTeamAccess(teamId, userId, scorerTokens);
  const supabase = createServerSupabaseClient();
  const players = (await listPlayers(teamId, userId, scorerTokens)) as PlayerRow[];
  const statsByPlayer = new Map(players.map((player) => [String(player.player_id), createEmptyStats(player)]));

  const { data: gameData, error: gameError } = await supabase
    .from("manual_games")
    .select("session_id,GameID,opponent_name,game_date,tournament_name")
    .eq("tracked_team_id", teamId)
    .order("game_date", { ascending: false })
    .order("updated_at", { ascending: false });
  if (gameError) throw new Error(gameError.message);

  const games = (gameData ?? []) as ManualGameRow[];
  const selectedGames = sessionId ? games.filter((game) => game.session_id === sessionId) : games;
  const selectedSessionIds = selectedGames.map((game) => game.session_id);
  if (!selectedSessionIds.length) {
    return {
      games: games.map((game) => ({
        sessionId: game.session_id,
        gameId: game.GameID,
        label: gameLabel(game),
        opponentName: game.opponent_name ?? undefined,
        gameDate: game.game_date ?? undefined,
        tournamentName: game.tournament_name ?? undefined
      })),
      selectedSessionId: sessionId ?? "",
      stats: Array.from(statsByPlayer.values())
    };
  }

  const { data: eventData, error: eventError } = await supabase
    .from("manual_events")
    .select("session_id,event_type,actor_player_id,target_player_id")
    .in("session_id", selectedSessionIds);
  if (eventError) throw new Error(eventError.message);

  const gamesByPlayer = new Map<string, Set<string>>();
  ((eventData ?? []) as ManualEventRow[]).forEach((event) => {
    if (event.actor_player_id && statsByPlayer.has(event.actor_player_id)) {
      incrementPlayerEvent(statsByPlayer.get(event.actor_player_id)!, event.event_type);
      if (!gamesByPlayer.has(event.actor_player_id)) gamesByPlayer.set(event.actor_player_id, new Set());
      gamesByPlayer.get(event.actor_player_id)!.add(event.session_id);
    }
    if (event.event_type === "throw" && event.target_player_id && statsByPlayer.has(event.target_player_id)) {
      const receiverStats = statsByPlayer.get(event.target_player_id)!;
      receiverStats.receptions += 1;
      receiverStats.totalEvents += 1;
      if (!gamesByPlayer.has(event.target_player_id)) gamesByPlayer.set(event.target_player_id, new Set());
      gamesByPlayer.get(event.target_player_id)!.add(event.session_id);
    }
  });

  statsByPlayer.forEach((stats, playerId) => {
    stats.games = gamesByPlayer.get(playerId)?.size ?? 0;
  });

  return {
    games: games.map((game) => ({
      sessionId: game.session_id,
      gameId: game.GameID,
      label: gameLabel(game),
      opponentName: game.opponent_name ?? undefined,
      gameDate: game.game_date ?? undefined,
      tournamentName: game.tournament_name ?? undefined
    })),
    selectedSessionId: sessionId ?? "",
    stats: Array.from(statsByPlayer.values()).sort((a, b) => {
      const jerseyA = Number(a.jerseyNumber);
      const jerseyB = Number(b.jerseyNumber);
      if (Number.isFinite(jerseyA) && Number.isFinite(jerseyB) && jerseyA !== jerseyB) return jerseyA - jerseyB;
      return a.playerName.localeCompare(b.playerName);
    })
  };
}
