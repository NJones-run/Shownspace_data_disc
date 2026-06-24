import { NextResponse } from "next/server";
import { jsonError, requestAccess } from "@/app/api/team-library-utils";
import { deactivatePlayer, updatePlayer } from "@/lib/team-library/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ teamId: string; playerId: string }> }
) {
  try {
    const { teamId, playerId } = await params;
    const { user } = await requestAccess(request);
    const body = await request.json();
    return NextResponse.json({ player: await updatePlayer(teamId, playerId, body, user?.id) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ teamId: string; playerId: string }> }
) {
  try {
    const { teamId, playerId } = await params;
    const { user } = await requestAccess(request);
    await deactivatePlayer(teamId, playerId, user?.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
