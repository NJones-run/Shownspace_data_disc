export type TeamSide = "home" | "away";
export type RulesMode = "ufa" | "club";

export type ManualEventType =
  | "point_start"
  | "possession_start"
  | "possession_end"
  | "pull"
  | "throw"
  | "catch"
  | "tipped_self_catch"
  | "drop"
  | "block"
  | "turnover"
  | "goal"
  | "line_change"
  | "penalty"
  | "timeout"
  | "correction";

export type SyncStatus = "local" | "queued" | "syncing" | "synced" | "error";

export interface CaptureGame {
  GameID: string;
  HomeTeamID: string;
  AwayTeamID: string;
  HomeScore: number;
  AwayScore: number;
  Status: string;
  Year: number;
  trackedTeamId?: string;
  opponentName?: string;
  gameDate?: string;
  tournamentName?: string;
}

export interface CapturePlayer {
  PlayerID: string;
  TeamID: string;
  Year: number;
  FirstName: string;
  LastName: string;
  JerseyNumber?: string;
}

export interface CaptureSession {
  sessionId: string;
  gameId: string;
  deviceId: string;
  scorerName?: string;
  trackedTeamId?: string;
  opponentName?: string;
  gameDate?: string;
  tournamentName?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface ManualEvent {
  clientEventId: string;
  sessionId: string;
  gameId: string;
  eventSeq: number;
  eventType: ManualEventType;
  teamSide?: TeamSide;
  teamId?: string;
  actorPlayerId?: string;
  targetPlayerId?: string;
  offensiveLinePlayerIds?: string[];
  defensiveLinePlayerIds?: string[];
  fieldX?: number;
  fieldY?: number;
  gameClockSecondsRemaining?: number;
  quarter: number;
  pointNumber: number;
  possessionNumber: number;
  homeScore: number;
  awayScore: number;
  occurredAt: string;
  payload: Record<string, unknown>;
  syncStatus: SyncStatus;
}

export interface CaptureState {
  game: CaptureGame;
  session: CaptureSession;
  players: CapturePlayer[];
  events: ManualEvent[];
  possessionTeamSide: TeamSide;
  rulesMode: RulesMode;
  gameClockSecondsRemaining?: number;
  quarter: number;
  pointNumber: number;
  possessionNumber: number;
}

export type CaptureAction =
  | { type: "replace_state"; state: CaptureState }
  | {
      type: "record_event";
      eventType: ManualEventType;
      teamSide?: TeamSide;
      actorPlayerId?: string;
      targetPlayerId?: string;
      offensiveLinePlayerIds?: string[];
      defensiveLinePlayerIds?: string[];
      fieldX?: number;
      fieldY?: number;
      gameClockSecondsRemaining?: number;
      payload?: Record<string, unknown>;
    }
  | { type: "undo_last" }
  | { type: "set_quarter"; quarter: number }
  | { type: "set_rules_mode"; rulesMode: RulesMode }
  | { type: "set_game_clock"; secondsRemaining?: number }
  | { type: "edit_event_clock"; clientEventId: string; secondsRemaining?: number }
  | { type: "mark_queued"; clientEventIds: string[] }
  | { type: "mark_synced"; clientEventIds: string[] }
  | { type: "mark_error"; clientEventIds: string[] };
