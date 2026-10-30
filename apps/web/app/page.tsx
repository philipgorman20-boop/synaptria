export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">SYNAPTRIA</p>
        <h1>The AI Operating System for Biotech</h1>
        <p className="subtitle">
          Coordinate programs, projects, vendors, documents, decisions, and reporting in one
          enterprise platform.
        </p>
        <div className="actions">
          <a href="/dashboard">Open workspace</a>
          <a className="secondary" href="/health">System health</a>
        </div>
      </section>
    </main>
  );
}
