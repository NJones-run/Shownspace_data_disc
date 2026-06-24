import { describe, expect, it } from "vitest";
import { getRecordEventBlockReason } from "@/lib/event-model/recording-rules";

describe("getRecordEventBlockReason", () => {
  it("blocks normal throw-to-self", () => {
    expect(
      getRecordEventBlockReason({
        eventType: "throw",
        actorPlayerId: "player-1",
        targetPlayerId: "player-1",
        hasFieldCoordinate: true
      })
    ).toContain("Tipped Self Catch");
  });

  it("allows tipped self catch with a player and field coordinate", () => {
    expect(
      getRecordEventBlockReason({
        eventType: "tipped_self_catch",
        actorPlayerId: "player-1",
        hasFieldCoordinate: true
      })
    ).toBeNull();
  });

  it("blocks UFA throws until possession clock is set", () => {
    expect(
      getRecordEventBlockReason({
        eventType: "throw",
        actorPlayerId: "player-1",
        targetPlayerId: "player-2",
        hasFieldCoordinate: true,
        clockRequired: true,
        clockSet: false
      })
    ).toContain("Set the game clock");
  });
});
