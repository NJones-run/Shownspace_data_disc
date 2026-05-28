import type { CaptureGame, CapturePlayer, CaptureState } from "./types";

export const demoGame: CaptureGame = {
  GameID: "2026-05-17-SD-OAK",
  HomeTeamID: "spiders",
  AwayTeamID: "growlers",
  HomeScore: 0,
  AwayScore: 0,
  Status: "Scheduled",
  Year: 2026
};

export const demoPlayers: CapturePlayer[] = [
  { PlayerID: "spiders-handler", TeamID: "spiders", Year: 2026, FirstName: "Home", LastName: "Handler", JerseyNumber: "7" },
  { PlayerID: "growlers-handler", TeamID: "growlers", Year: 2026, FirstName: "Away", LastName: "Handler", JerseyNumber: "11" }
];

export const demoLinePresets = [
  { id: "handlers", label: "Handler Stack", playerIds: ["spiders-handler"] },
  { id: "mixed", label: "Mixed", playerIds: ["spiders-handler", "growlers-handler"] }
];

export function createDemoState(): CaptureState {
  const now = new Date().toISOString();
  return {
    game: demoGame,
    session: {
      sessionId: `session-${demoGame.GameID}`,
      gameId: demoGame.GameID,
      deviceId: "local-device",
      scorerName: "Demo Scorer",
      createdAt: now,
      updatedAt: now,
      syncStatus: "local"
    },
    players: demoPlayers,
    events: [],
    possessionTeamSide: "home",
    quarter: 1,
    pointNumber: 1,
    possessionNumber: 1
  };
}
