import { NextResponse } from "next/server";
import { demoGame, demoPlayers } from "@/lib/event-model/fixtures";

export async function GET(_request: Request, { params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  return NextResponse.json({
    game: { ...demoGame, GameID: gameId },
    players: demoPlayers,
    source: "demo"
  });
}
