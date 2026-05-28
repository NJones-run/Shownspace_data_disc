import Link from "next/link";

export default function ReviewPage() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true" />
          <span>Review</span>
        </Link>
        <nav className="nav" aria-label="Primary">
          <Link href="/games">Games</Link>
          <Link href="/capture">Capture</Link>
        </nav>
      </header>
      <section className="page">
        <div className="panel">
          <h1>Staging Review</h1>
          <p className="muted">
            Review sessions will show uploaded manual events, validation status, and approval actions.
          </p>
        </div>
      </section>
    </main>
  );
}
