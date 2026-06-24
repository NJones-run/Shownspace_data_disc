import { NextResponse } from "next/server";
import { jsonError, requestAccess } from "@/app/api/team-library-utils";
import { assertTeamAccess, updateTeam } from "@/lib/team-library/server";

export async function GET(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const { user, scorerTokens } = await requestAccess(request);
    await assertTeamAccess(teamId, user?.id, scorerTokens);
    return NextResponse.json({ teamId });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const { user } = await requestAccess(request);
    const { name } = await request.json();
    return NextResponse.json({ team: await updateTeam(teamId, name, user?.id) });
  } catch (error) {
    return jsonError(error);
  }
}
