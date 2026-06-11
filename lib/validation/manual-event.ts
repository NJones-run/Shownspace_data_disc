import { z } from "zod";

export const manualEventSchema = z.object({
  clientEventId: z.string().min(1),
  sessionId: z.string().min(1),
  gameId: z.string().min(1),
  eventSeq: z.number().int().positive(),
  eventType: z.enum([
    "point_start",
    "possession_start",
    "possession_end",
    "pull",
    "throw",
    "catch",
    "drop",
    "block",
    "turnover",
    "goal",
    "line_change",
    "penalty",
    "timeout",
    "correction"
  ]),
  teamSide: z.enum(["home", "away"]).optional(),
  teamId: z.string().optional(),
  actorPlayerId: z.string().optional(),
  targetPlayerId: z.string().optional(),
  offensiveLinePlayerIds: z.array(z.string()).optional(),
  defensiveLinePlayerIds: z.array(z.string()).optional(),
  fieldX: z.number().min(0).max(100).optional(),
  fieldY: z.number().min(0).max(100).optional(),
  gameClockSecondsRemaining: z.number().int().min(0).optional(),
  quarter: z.number().int().positive(),
  pointNumber: z.number().int().positive(),
  possessionNumber: z.number().int().positive(),
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  occurredAt: z.string().datetime(),
  payload: z.record(z.unknown()).default({}),
  syncStatus: z.enum(["local", "queued", "syncing", "synced", "error"]).default("local")
});

export const manualEventBatchSchema = z.object({
  sessionId: z.string().min(1),
  gameId: z.string().min(1),
  deviceId: z.string().optional(),
  scorerName: z.string().optional(),
  events: z.array(manualEventSchema).min(1)
});

export type ManualEventBatchInput = z.infer<typeof manualEventBatchSchema>;
