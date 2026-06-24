import { NextResponse } from "next/server";
import { jsonError, requestAccess } from "@/app/api/team-library-utils";
import { revokeInvite } from "@/lib/team-library/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ teamId: string; inviteId: string }> }
) {
  try {
    const { teamId, inviteId } = await params;
    const { user } = await requestAccess(request);
    await revokeInvite(teamId, inviteId, user?.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
