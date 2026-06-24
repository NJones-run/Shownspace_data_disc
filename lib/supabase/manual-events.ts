import { createServerSupabaseClient } from "./client";
import type { ManualEventBatchInput } from "@/lib/validation/manual-event";

type SupabaseErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

function eventToManualEventRow(event: ManualEventBatchInput["events"][number]) {
  return {
    session_id: event.sessionId,
    client_event_id: event.clientEventId,
    GameID: event.gameId,
    event_seq: event.eventSeq,
    event_type: event.eventType,
    team_side: event.teamSide ?? null,
    team_id: event.teamId ?? null,
    actor_player_id: event.actorPlayerId ?? null,
    target_player_id: event.targetPlayerId ?? null,
    offensive_line_player_ids: event.offensiveLinePlayerIds ?? null,
    defensive_line_player_ids: event.defensiveLinePlayerIds ?? null,
    field_x: event.fieldX ?? null,
    field_y: event.fieldY ?? null,
    game_clock_seconds_remaining: event.gameClockSecondsRemaining ?? null,
    quarter: event.quarter,
    point_number: event.pointNumber,
    possession_number: event.possessionNumber,
    home_score: event.homeScore,
    away_score: event.awayScore,
    occurred_at: event.occurredAt,
    payload: event.payload,
    sync_status: "accepted_for_review",
    validation_status: "pending_review"
  };
}

function throwIfSupabaseError(error: SupabaseErrorLike | null) {
  if (error) {
    const parts = [error.message, error.code, error.details, error.hint].filter(Boolean);
    throw new Error(parts.length ? parts.join(" | ") : JSON.stringify(error));
  }
}

export async function persistManualEventBatch(batch: ManualEventBatchInput) {
  const supabase = createServerSupabaseClient();
  const now = new Date().toISOString();

  const { error: sessionError } = await supabase.from("manual_games").upsert(
    {
      session_id: batch.sessionId,
      GameID: batch.gameId,
      device_id: batch.deviceId ?? null,
      scorer_name: batch.scorerName ?? null,
      tracked_team_id: batch.trackedTeamId ?? null,
      opponent_name: batch.opponentName ?? null,
      game_date: batch.gameDate ?? null,
      tournament_name: batch.tournamentName ?? null,
      sync_status: "accepted_for_review",
      updated_at: now
    },
    { onConflict: "session_id" }
  );
  throwIfSupabaseError(sessionError);

  const rows = batch.events.map(eventToManualEventRow);
  const { error: eventError } = await supabase
    .from("manual_events")
    .upsert(rows, { onConflict: "session_id,event_seq" });
  throwIfSupabaseError(eventError);

  return batch.events.map((event) => event.clientEventId);
}
