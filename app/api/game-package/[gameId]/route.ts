import { NextResponse } from "next/server";
import { demoGame, demoPlayers } from "@/lib/event-model/fixtures";
import {
  listAccessibleTeams,
  listPlayers,
  parseScorerTokens,
  getBearerUser,
  playerRowToCapturePlayer,
  sharedGameFromTrackedTeam
} from "@/lib/team-library/server";

export async function GET(_request: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  if (gameId === "shared") {
    try {
      const url = new URL(_request.url);
      const teamId = url.searchParams.get("teamId") ?? "";
      const opponentName = url.searchParams.get("opponentName")?.trim() ?? "";
      const gameDate = url.searchParams.get("gameDate")?.trim() ?? "";
      const tournamentName = url.searchParams.get("tournamentName")?.trim() || undefined;
      if (!teamId || !opponentName || !gameDate) {
        return NextResponse.json({ error: "Team, opponent, and game date are required" }, { status: 400 });
      }
      const user = await getBearerUser(_request);
      const scorerTokens = parseScorerTokens(_request.headers.get("x-scorer-tokens"));
      const teams = await listAccessibleTeams(user?.id, scorerTokens);
      const team = teams.find((candidate) => candidate.id === teamId);
      if (!team) {
        return NextResponse.json({ error: "Team access required" }, { status: 403 });
      }
      const players = await listPlayers(team.id, user?.id, scorerTokens);
      return NextResponse.json({
        game: sharedGameFromTrackedTeam({ team, opponentName, gameDate, tournamentName }),
        players: players.filter((player) => player.active).map((player) => playerRowToCapturePlayer(player)),
        source: "shared"
      });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load shared game" }, { status: 400 });
    }
  }
  return NextResponse.json({
    game: { ...demoGame, GameID: gameId },
    players: demoPlayers,
    source: "demo"
  });
}
