import { NextResponse } from "next/server";

export async function POST(_request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return NextResponse.json({
    sessionId,
    status: "approved",
    promoted: false
  });
}
