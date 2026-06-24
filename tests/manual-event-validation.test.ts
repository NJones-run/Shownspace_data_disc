import { describe, expect, it } from "vitest";
import { manualEventBatchSchema, manualEventSchema } from "@/lib/validation/manual-event";

const baseEvent = {
  clientEventId: "event-1",
  sessionId: "session-1",
  gameId: "game-1",
  eventSeq: 1,
  teamSide: "home",
  teamId: "home",
  actorPlayerId: "player-1",
  quarter: 1,
  pointNumber: 1,
  possessionNumber: 1,
  homeScore: 0,
  awayScore: 0,
  occurredAt: "2026-05-27T00:00:00.000Z",
  payload: {},
  syncStatus: "local"
};

describe("manualEventSchema", () => {
  it("accepts tipped self catch events", () => {
    const parsed = manualEventSchema.safeParse({
      ...baseEvent,
      eventType: "tipped_self_catch",
      fieldX: 41,
      fieldY: 52
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts club-mode events without game clock", () => {
    const parsed = manualEventSchema.safeParse({
      ...baseEvent,
      eventType: "throw",
      targetPlayerId: "player-2",
      fieldX: 41,
      fieldY: 52
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts single-team game metadata on manual event batches", () => {
    const parsed = manualEventBatchSchema.safeParse({
      sessionId: "session-1",
      gameId: "game-1",
      trackedTeamId: "team-1",
      opponentName: "Rival Club",
      gameDate: "2026-06-23",
      tournamentName: "Summer Invite",
      events: [{ ...baseEvent, eventType: "goal" }]
    });

    expect(parsed.success).toBe(true);
  });
});
