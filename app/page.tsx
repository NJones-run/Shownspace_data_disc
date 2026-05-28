import Link from "next/link";

export default function HomePage() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>Frisbee Live Capture</span>
        </div>
        <nav className="nav" aria-label="Primary">
          <Link href="/games">Games</Link>
          <Link href="/capture">Capture</Link>
          <Link href="/review">Review</Link>
        </nav>
      </header>
      <section className="page">
        <div className="panel">
          <h1>Live Event Capture</h1>
          <p className="muted">
            Tablet-first scorer workflow with local event storage, sync queues, and staging review.
          </p>
          <Link className="button primary" href="/capture">
            Open Capture
          </Link>
        </div>
      </section>
    </main>
  );
}
