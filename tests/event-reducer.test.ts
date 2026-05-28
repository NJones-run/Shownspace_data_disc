import { describe, expect, it } from "vitest";
import { createDemoState, demoLinePresets } from "@/lib/event-model/fixtures";
import { captureReducer } from "@/lib/event-model/reducer";

describe("captureReducer", () => {
  it("records a goal and updates score", () => {
    const state = createDemoState();
    const next = captureReducer(state, {
      type: "record_event",
      eventType: "goal",
      teamSide: "home",
      payload: { clientEventId: "e1", occurredAt: "2026-05-27T00:00:00.000Z" }
    });

    expect(next.game.HomeScore).toBe(1);
    expect(next.game.AwayScore).toBe(0);
    expect(next.events).toHaveLength(1);
    expect(next.events[0].clientEventId).toBe("e1");
  });

  it("records a point start with offense and defense line data", () => {
    const state = createDemoState();
    const next = captureReducer(state, {
      type: "record_event",
      eventType: "point_start",
      offensiveLinePlayerIds: ["spiders-handler"],
      defensiveLinePlayerIds: ["growlers-handler"],
      payload: { clientEventId: "e2", occurredAt: "2026-05-27T00:00:00.000Z" }
    });

    expect(next.events).toHaveLength(1);
    expect(next.events[0].eventType).toBe("point_start");
    expect(next.events[0].offensiveLinePlayerIds).toEqual(["spiders-handler"]);
    expect(next.events[0].defensiveLinePlayerIds).toEqual(["growlers-handler"]);
  });

  it("records a throw with thrower, receiver, and field coordinates", () => {
    const state = createDemoState();
    const next = captureReducer(state, {
      type: "record_event",
      eventType: "throw",
      actorPlayerId: "spiders-handler",
      targetPlayerId: "growlers-handler",
      fieldX: 42.5,
      fieldY: 18.3,
      payload: { clientEventId: "e3", occurredAt: "2026-05-27T00:00:00.000Z" }
    });

    expect(next.events).toHaveLength(1);
    expect(next.events[0].eventType).toBe("throw");
    expect(next.events[0].actorPlayerId).toBe("spiders-handler");
    expect(next.events[0].targetPlayerId).toBe("growlers-handler");
    expect(next.events[0].fieldX).toBe(42.5);
    expect(next.events[0].fieldY).toBe(18.3);
  });

  it("undoes the last event", () => {
    const state = createDemoState();
    const scored = captureReducer(state, {
      type: "record_event",
      eventType: "goal",
      teamSide: "away",
      payload: { clientEventId: "e1", occurredAt: "2026-05-27T00:00:00.000Z" }
    });
    const undone = captureReducer(scored, { type: "undo_last" });

    expect(undone.game.AwayScore).toBe(0);
    expect(undone.events).toHaveLength(0);
  });

  it("records a possession_start and applies offensive line and team", () => {
    const state = createDemoState();
    const preset = demoLinePresets[0];
    const next = captureReducer(state, {
      type: "record_event",
      eventType: "possession_start",
      teamSide: "away",
      offensiveLinePlayerIds: preset.playerIds,
      payload: { clientEventId: "ps1", occurredAt: "2026-05-27T00:00:00.000Z" }
    });

    expect(next.events).toHaveLength(1);
    expect(next.events[0].eventType).toBe("possession_start");
    expect(next.events[0].offensiveLinePlayerIds).toEqual(preset.playerIds);
    expect(next.possessionTeamSide).toBe("away");
    expect(next.possessionNumber).toBe(1);
  });

  it("infers thrower from previous catch when actor missing", () => {
    const state = createDemoState();
    const afterCatch = captureReducer(state, {
      type: "record_event",
      eventType: "catch",
      actorPlayerId: "spiders-handler",
      payload: { clientEventId: "e1", occurredAt: "2026-05-27T00:00:00.000Z" }
    });
    const afterThrow = captureReducer(afterCatch, {
      type: "record_event",
      eventType: "throw",
      targetPlayerId: "growlers-handler",
      payload: { clientEventId: "e2", occurredAt: "2026-05-27T00:00:01.000Z" }
    });

    expect(afterThrow.events).toHaveLength(2);
    expect(afterThrow.events[1].eventType).toBe("throw");
    expect(afterThrow.events[1].actorPlayerId).toBe("spiders-handler");
    expect(afterThrow.events[1].targetPlayerId).toBe("growlers-handler");
  });
});
