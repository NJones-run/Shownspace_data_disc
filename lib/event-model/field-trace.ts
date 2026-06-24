import type { ManualEvent } from "./types";

export interface FieldTracePoint {
  eventSeq: number;
  eventType: "throw" | "catch" | "tipped_self_catch";
  x: number;
  y: number;
}

const traceBoundaryEvents = new Set(["block", "goal", "possession_end", "turnover"]);

export function getCurrentPossessionTrace(events: ManualEvent[]): FieldTracePoint[] {
  let latestBoundaryIndex = -1;
  for (let index = events.length - 1; index >= 0; index -= 1) {
    if (traceBoundaryEvents.has(events[index].eventType)) {
      latestBoundaryIndex = index;
      break;
    }
  }
  return events
    .slice(latestBoundaryIndex + 1)
    .filter(
      (
        event
      ): event is ManualEvent & { eventType: "throw" | "catch" | "tipped_self_catch"; fieldX: number; fieldY: number } =>
        (event.eventType === "throw" || event.eventType === "catch" || event.eventType === "tipped_self_catch") &&
        event.fieldX !== undefined &&
        event.fieldY !== undefined
    )
    .map((event) => ({
      eventSeq: event.eventSeq,
      eventType: event.eventType,
      x: event.fieldX,
      y: event.fieldY
    }));
}
