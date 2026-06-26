import { NextResponse } from "next/server";
import { jsonError, requestAccess } from "@/app/api/team-library-utils";
import { getTeamPlayerStats } from "@/lib/team-library/stats";

export async function GET(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const { user, scorerTokens } = await requestAccess(request);
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId")?.trim() || undefined;
    return NextResponse.json(await getTeamPlayerStats(teamId, sessionId, user?.id, scorerTokens));
  } catch (error) {
    return jsonError(error);
  }
}
