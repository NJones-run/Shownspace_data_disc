import { NextResponse } from "next/server";
import { jsonError } from "@/app/api/team-library-utils";
import { acceptInvite } from "@/lib/team-library/server";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    return NextResponse.json({ team: await acceptInvite(token) });
  } catch (error) {
    return jsonError(error);
  }
}
