import { nanoid } from "nanoid";
import type { CaptureAction, CaptureState, ManualEvent, TeamSide } from "./types";

function nextPossessionSide(current: TeamSide): TeamSide {
  return current === "home" ? "away" : "home";
}

function applyScore(
  eventType: string,
  teamSide: TeamSide | undefined,
  homeScore: number,
  awayScore: number
) {
  if (eventType !== "goal" || !teamSide) {
    return { homeScore, awayScore };
  }
  return teamSide === "home"
    ? { homeScore: homeScore + 1, awayScore }
    : { homeScore, awayScore: awayScore + 1 };
}

function initialLike(state: CaptureState): CaptureState {
  return {
    ...state,
    events: [],
    game: { ...state.game, HomeScore: 0, AwayScore: 0 },
    possessionTeamSide: "home",
    quarter: 1,
    pointNumber: 1,
    possessionNumber: 1
  };
}

export function captureReducer(state: CaptureState, action: CaptureAction): CaptureState {
  if (action.type === "undo_last") {
    const events = state.events.slice(0, -1);
    const rebuilt = events.reduce(
      (current, event) =>
        captureReducer(current, {
          type: "record_event",
          eventType: event.eventType,
          teamSide: event.teamSide,
          actorPlayerId: event.actorPlayerId,
          targetPlayerId: event.targetPlayerId,
          offensiveLinePlayerIds: event.offensiveLinePlayerIds,
          defensiveLinePlayerIds: event.defensiveLinePlayerIds,
          fieldX: event.fieldX,
          fieldY: event.fieldY,
          gameClockSecondsRemaining: event.gameClockSecondsRemaining,
          payload: { ...event.payload, clientEventId: event.clientEventId, occurredAt: event.occurredAt }
        }),
      initialLike(state)
    );
    return { ...rebuilt, session: { ...rebuilt.session, updatedAt: new Date().toISOString() } };
  }

  if (action.type === "mark_queued" || action.type === "mark_synced" || action.type === "mark_error") {
    const syncStatus = action.type === "mark_synced" ? "synced" : action.type === "mark_error" ? "error" : "queued";
    const ids = new Set(action.clientEventIds);
    return {
      ...state,
      events: state.events.map((event) => (ids.has(event.clientEventId) ? { ...event, syncStatus } : event))
    };
  }

  if (action.type === "set_quarter") {
    return {
      ...state,
      quarter: action.quarter,
      session: { ...state.session, updatedAt: new Date().toISOString() }
    };
  }

  const now = new Date().toISOString();
  const teamSide = action.teamSide ?? state.possessionTeamSide;
  const scores = applyScore(action.eventType, teamSide, state.game.HomeScore, state.game.AwayScore);
  const event: ManualEvent = {
    clientEventId: String(action.payload?.clientEventId ?? nanoid()),
    sessionId: state.session.sessionId,
    gameId: state.game.GameID,
    eventSeq: state.events.length + 1,
    eventType: action.eventType,
    teamSide,
    teamId: teamSide === "home" ? state.game.HomeTeamID : state.game.AwayTeamID,
    actorPlayerId: action.actorPlayerId,
    targetPlayerId: action.targetPlayerId,
    offensiveLinePlayerIds: action.offensiveLinePlayerIds,
    defensiveLinePlayerIds: action.defensiveLinePlayerIds,
    fieldX: action.fieldX,
    fieldY: action.fieldY,
    gameClockSecondsRemaining: action.gameClockSecondsRemaining,
    quarter: state.quarter,
    pointNumber: state.pointNumber,
    possessionNumber: state.possessionNumber,
    homeScore: scores.homeScore,
    awayScore: scores.awayScore,
    occurredAt: String(action.payload?.occurredAt ?? now),
    payload: action.payload ?? {},
    syncStatus: "local"
  };
  // If this is a possession boundary, apply special handling
  const isPossessionStart = action.eventType === "possession_start";
  const isPossessionEnd = action.eventType === "possession_end";
  const isBlock = action.eventType === "block";
  const isTurnover = action.eventType === "turnover";

  // Infer the thrower for a throw event when actorPlayerId was not provided
  if (action.eventType === "throw" && !event.actorPlayerId) {
    const lastCatch = [...state.events].reverse().find((e) => e.eventType === "catch" && e.actorPlayerId);
    if (lastCatch) {
      event.actorPlayerId = lastCatch.actorPlayerId;
    }
  }

  const pointEnded = action.eventType === "goal";

  return {
    ...state,
    game: { ...state.game, HomeScore: scores.homeScore, AwayScore: scores.awayScore },
    session: { ...state.session, updatedAt: now },
    events: [...state.events, event],
    possessionTeamSide: pointEnded
      ? nextPossessionSide(teamSide)
      : isPossessionStart
      ? teamSide
      : isPossessionEnd
      ? state.possessionTeamSide
      : isBlock
      ? teamSide
      : isTurnover
      ? nextPossessionSide(teamSide)
      : state.possessionTeamSide,
    possessionNumber:
      pointEnded || isPossessionStart
        ? 1
        : isPossessionEnd || isBlock || isTurnover
        ? state.possessionNumber + 1
        : state.possessionNumber,
    pointNumber: pointEnded ? state.pointNumber + 1 : state.pointNumber
  };
}
