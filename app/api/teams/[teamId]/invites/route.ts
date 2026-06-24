import { NextResponse } from "next/server";
import { jsonError, requestAccess } from "@/app/api/team-library-utils";
import { createInvite, listInvites } from "@/lib/team-library/server";

export async function GET(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const { user } = await requestAccess(request);
    return NextResponse.json({ invites: await listInvites(teamId, user?.id) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  try {
    const { teamId } = await params;
    const { user } = await requestAccess(request);
    const { label } = await request.json().catch(() => ({ label: "" }));
    const result = await createInvite(teamId, user?.id, label);
    const origin = new URL(request.url).origin;
    return NextResponse.json({
      invite: result.invite,
      token: result.token,
      url: `${origin}/invite/team?token=${encodeURIComponent(result.token)}`
    });
  } catch (error) {
    return jsonError(error);
  }
}
