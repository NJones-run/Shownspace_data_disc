"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { demoGame, demoPlayers } from "@/lib/event-model/fixtures";

export default function HomePage() {
  const router = useRouter();
  const [awayTeam, setAwayTeam] = useState("");
  const [homeTeam, setHomeTeam] = useState("");

  const onCreateCustomGame = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams({
      gameId: "custom",
      away: awayTeam.trim() || "Away",
      home: homeTeam.trim() || "Home"
    });
    router.push(`/capture?${params.toString()}`);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>Frisbee Live Capture</span>
        </div>
        <nav className="nav" aria-label="Primary">
          <Link href="/review">Review</Link>
        </nav>
      </header>

      <section className="page game-select-page">
        <div className="selection-header">
          <div>
            <h1>Select Game</h1>
            <p className="muted">Choose the demo matchup or enter teams for a custom capture session.</p>
          </div>
        </div>

        <div className="game-selection-grid">
          <section className="panel game-card">
            <div>
              <span className="status-pill">Demo roster</span>
              <h2>NY Empire at Salt Lake Shred</h2>
              <p className="muted">
                {demoGame.AwayTeamID} at {demoGame.HomeTeamID} · {demoPlayers.length} players loaded
              </p>
            </div>
            <Link className="button primary full-width" href={`/capture?gameId=${demoGame.GameID}`}>
              Start Capture
            </Link>
          </section>

          <form className="panel custom-game-form" onSubmit={onCreateCustomGame}>
            <div>
              <span className="status-pill neutral">Custom</span>
              <h2>Enter Custom Game</h2>
            </div>
            <div className="field">
              <label htmlFor="away-team">Away Team</label>
              <input
                id="away-team"
                value={awayTeam}
                onChange={(event) => setAwayTeam(event.target.value)}
                placeholder="Away"
              />
            </div>
            <div className="field">
              <label htmlFor="home-team">Home Team</label>
              <input
                id="home-team"
                value={homeTeam}
                onChange={(event) => setHomeTeam(event.target.value)}
                placeholder="Home"
              />
            </div>
            <button className="button primary full-width" type="submit">
              Create Game
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
