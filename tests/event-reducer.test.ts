import { describe, expect, it } from "vitest";
import { createCustomState, createDemoState, demoLinePresets, demoPlayers } from "@/lib/event-model/fixtures";
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
    expect(next.pointNumber).toBe(2);
    expect(next.possessionNumber).toBe(1);
  });

  it("records a point start with offense and defense line data", () => {
    const state = createDemoState();
    const next = captureReducer(state, {
      type: "record_event",
      eventType: "point_start",
      offensiveLinePlayerIds: ["shred-jordan-kerr"],
      defensiveLinePlayerIds: ["empire-alex-atkins"],
      payload: { clientEventId: "e2", occurredAt: "2026-05-27T00:00:00.000Z" }
    });

    expect(next.events).toHaveLength(1);
    expect(next.events[0].eventType).toBe("point_start");
    expect(next.events[0].offensiveLinePlayerIds).toEqual(["shred-jordan-kerr"]);
    expect(next.events[0].defensiveLinePlayerIds).toEqual(["empire-alex-atkins"]);
  });

  it("records a throw with thrower, receiver, and field coordinates", () => {
    const state = createDemoState();
    const next = captureReducer(state, {
      type: "record_event",
      eventType: "throw",
      actorPlayerId: "shred-jordan-kerr",
      targetPlayerId: "empire-alex-atkins",
      fieldX: 42.5,
      fieldY: 18.3,
      gameClockSecondsRemaining: 845,
      payload: { clientEventId: "e3", occurredAt: "2026-05-27T00:00:00.000Z" }
    });

    expect(next.events).toHaveLength(1);
    expect(next.events[0].eventType).toBe("throw");
    expect(next.events[0].actorPlayerId).toBe("shred-jordan-kerr");
    expect(next.events[0].targetPlayerId).toBe("empire-alex-atkins");
    expect(next.events[0].fieldX).toBe(42.5);
    expect(next.events[0].fieldY).toBe(18.3);
    expect(next.events[0].gameClockSecondsRemaining).toBe(845);
    expect(next.possessionNumber).toBe(1);
  });

  it("records possession_end and advances possession without changing team", () => {
    const state = createDemoState();
    const next = captureReducer(state, {
      type: "record_event",
      eventType: "possession_end",
      teamSide: "home",
      gameClockSecondsRemaining: 810,
      payload: { clientEventId: "pe1", occurredAt: "2026-05-27T00:00:00.000Z" }
    });

    expect(next.events).toHaveLength(1);
    expect(next.events[0].eventType).toBe("possession_end");
    expect(next.events[0].gameClockSecondsRemaining).toBe(810);
    expect(next.possessionTeamSide).toBe("home");
    expect(next.possessionNumber).toBe(2);
  });

  it("records a block as a possession boundary for the blocking team", () => {
    const state = createDemoState();
    const next = captureReducer(state, {
      type: "record_event",
      eventType: "block",
      teamSide: "away",
      payload: { clientEventId: "b1", occurredAt: "2026-05-27T00:00:00.000Z" }
    });

    expect(next.events).toHaveLength(1);
    expect(next.events[0].eventType).toBe("block");
    expect(next.possessionTeamSide).toBe("away");
    expect(next.possessionNumber).toBe(2);
  });

  it("records a turnover as a possession boundary for the other team", () => {
    const state = createDemoState();
    const next = captureReducer(state, {
      type: "record_event",
      eventType: "turnover",
      teamSide: "home",
      payload: { clientEventId: "t1", occurredAt: "2026-05-27T00:00:00.000Z" }
    });

    expect(next.events).toHaveLength(1);
    expect(next.events[0].eventType).toBe("turnover");
    expect(next.possessionTeamSide).toBe("away");
    expect(next.possessionNumber).toBe(2);
  });

  it("sets the active quarter for newly recorded events", () => {
    const state = createDemoState();
    const quarterTwo = captureReducer(state, { type: "set_quarter", quarter: 2 });
    const next = captureReducer(quarterTwo, {
      type: "record_event",
      eventType: "pull",
      payload: { clientEventId: "q2", occurredAt: "2026-05-27T00:00:00.000Z" }
    });

    expect(quarterTwo.quarter).toBe(2);
    expect(next.events[0].quarter).toBe(2);
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
      actorPlayerId: "shred-jordan-kerr",
      payload: { clientEventId: "e1", occurredAt: "2026-05-27T00:00:00.000Z" }
    });
    const afterThrow = captureReducer(afterCatch, {
      type: "record_event",
      eventType: "throw",
      targetPlayerId: "empire-alex-atkins",
      payload: { clientEventId: "e2", occurredAt: "2026-05-27T00:00:01.000Z" }
    });

    expect(afterThrow.events).toHaveLength(2);
    expect(afterThrow.events[1].eventType).toBe("throw");
    expect(afterThrow.events[1].actorPlayerId).toBe("shred-jordan-kerr");
    expect(afterThrow.events[1].targetPlayerId).toBe("empire-alex-atkins");
  });

  it("creates demo state with real 2026 rosters", () => {
    const state = createDemoState();

    expect(state.game.GameID).toBe("2026-demo-NY-SLC");
    expect(state.game.HomeTeamID).toBe("shred");
    expect(state.game.AwayTeamID).toBe("empire");
    expect(state.players).toHaveLength(demoPlayers.length);
    expect(state.players.some((player) => player.PlayerID === "empire-alex-atkins")).toBe(true);
    expect(state.players.some((player) => player.PlayerID === "shred-jordan-kerr")).toBe(true);
  });

  it("creates custom state with entered teams and empty rosters", () => {
    const state = createCustomState("Visitors", "Hosts");

    expect(state.game.GameID).toBe("custom-visitors-at-hosts");
    expect(state.game.AwayTeamID).toBe("Visitors");
    expect(state.game.HomeTeamID).toBe("Hosts");
    expect(state.players).toEqual([]);
    expect(state.events).toEqual([]);
  });
});
