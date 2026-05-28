import Link from "next/link";
import { demoGame } from "@/lib/event-model/fixtures";

export default function GamesPage() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true" />
          <span>Games</span>
        </Link>
        <nav className="nav" aria-label="Primary">
          <Link href="/capture">Capture</Link>
          <Link href="/review">Review</Link>
        </nav>
      </header>
      <section className="page">
        <div className="panel">
          <h1>Game Packages</h1>
          <div className="card" style={{ padding: 16 }}>
            <strong>{demoGame.AwayTeamID} at {demoGame.HomeTeamID}</strong>
            <p className="muted">{demoGame.GameID}</p>
            <Link className="button primary" href="/capture">
              Open
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
