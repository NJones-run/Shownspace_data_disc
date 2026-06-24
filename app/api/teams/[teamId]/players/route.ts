import { NextResponse } from "next/server";
import { jsonError, requestAccess } from "@/app/api/team-library-utils";
import { addPlayer, listPlayers } from "@/lib/team-library/server";

export async function GET(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const { user, scorerTokens } = await requestAccess(request);
    return NextResponse.json({ players: await listPlayers(teamId, user?.id, scorerTokens) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const { user } = await requestAccess(request);
    const body = await request.json();
    return NextResponse.json({ player: await addPlayer(teamId, body, user?.id) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
