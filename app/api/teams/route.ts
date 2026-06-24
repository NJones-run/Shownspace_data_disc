import { NextResponse } from "next/server";
import { jsonError, requestAccess } from "@/app/api/team-library-utils";
import { createTeam, listAccessibleTeams } from "@/lib/team-library/server";

export async function GET(request: Request) {
  try {
    const { user, scorerTokens } = await requestAccess(request);
    return NextResponse.json({ teams: await listAccessibleTeams(user?.id, scorerTokens) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requestAccess(request);
    const { name } = await request.json();
    return NextResponse.json({ team: await createTeam(name, user?.id) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
