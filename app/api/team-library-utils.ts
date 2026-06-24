import { NextResponse } from "next/server";
import { getBearerUser, parseScorerTokens } from "@/lib/team-library/server";

export function jsonError(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "Request failed";
  const resolvedStatus = message.includes("required") ? 403 : status;
  return NextResponse.json({ error: message }, { status: resolvedStatus });
}

export async function requestAccess(request: Request) {
  const user = await getBearerUser(request);
  const scorerTokens = parseScorerTokens(request.headers.get("x-scorer-tokens"));
  return { user, scorerTokens };
}
