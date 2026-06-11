import { describe, expect, it } from "vitest";
import { getCurrentPossessionTrace } from "@/lib/event-model/field-trace";
import type { ManualEvent } from "@/lib/event-model/types";

function event(overrides: Partial<ManualEvent>): ManualEvent {
  return {
    clientEventId: String(overrides.eventSeq ?? 1),
    sessionId: "session",
    gameId: "game",
    eventSeq: overrides.eventSeq ?? 1,
    eventType: overrides.eventType ?? "throw",
    quarter: 1,
    pointNumber: 1,
    possessionNumber: 1,
    homeScore: 0,
    awayScore: 0,
    occurredAt: "2026-05-27T00:00:00.000Z",
    payload: {},
    syncStatus: "local",
    ...overrides
  };
}

describe("field trace helpers", () => {
  it("returns throw and catch locations after the latest possession boundary", () => {
    const trace = getCurrentPossessionTrace([
      event({ eventSeq: 1, eventType: "throw", fieldX: 10, fieldY: 20 }),
      event({ eventSeq: 2, eventType: "possession_end" }),
      event({ eventSeq: 3, eventType: "throw", fieldX: 30, fieldY: 40 }),
      event({ eventSeq: 4, eventType: "catch", fieldX: 50, fieldY: 60 }),
      event({ eventSeq: 5, eventType: "drop", fieldX: 70, fieldY: 80 })
    ]);

    expect(trace).toEqual([
      { eventSeq: 3, eventType: "throw", x: 30, y: 40 },
      { eventSeq: 4, eventType: "catch", x: 50, y: 60 }
    ]);
  });

  it("clears trace after a goal", () => {
    const trace = getCurrentPossessionTrace([
      event({ eventSeq: 1, eventType: "throw", fieldX: 10, fieldY: 20 }),
      event({ eventSeq: 2, eventType: "goal" })
    ]);

    expect(trace).toEqual([]);
  });

  it("clears trace after block and turnover boundaries", () => {
    const afterBlock = getCurrentPossessionTrace([
      event({ eventSeq: 1, eventType: "throw", fieldX: 10, fieldY: 20 }),
      event({ eventSeq: 2, eventType: "block" })
    ]);
    const afterTurnover = getCurrentPossessionTrace([
      event({ eventSeq: 1, eventType: "catch", fieldX: 30, fieldY: 40 }),
      event({ eventSeq: 2, eventType: "turnover" })
    ]);

    expect(afterBlock).toEqual([]);
    expect(afterTurnover).toEqual([]);
  });
});
