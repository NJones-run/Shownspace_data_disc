import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return NextResponse.json({
    sessionId,
    status: "pending_review",
    events: []
  });
}
