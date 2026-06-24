"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { saveScorerToken } from "@/lib/team-library/client-access";

function InviteTeamContent() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Accepting team invite...");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setMessage("Missing invite token.");
      return;
    }
    fetch("/api/team-invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Invite failed");
        saveScorerToken(token);
        setMessage(`Invite accepted for ${body.team?.name ?? "team"}.`);
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "Invite failed"));
  }, [searchParams]);

  return (
    <main className="app-shell">
      <section className="page">
        <div className="panel">
          <h1>Team Invite</h1>
          <p className="muted">{message}</p>
          <Link className="button primary" href="/">
            Open Team Library
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function InviteTeamPage() {
  return (
    <Suspense fallback={<main className="app-shell"><section className="page">Loading invite...</section></main>}>
      <InviteTeamContent />
    </Suspense>
  );
}
