const cards = [
  ['Programs', '0 active'],
  ['Projects', '0 in progress'],
  ['Open risks', '0'],
  ['Pending decisions', '0'],
];

export default function DashboardPage() {
  return (
    <main className="dashboard">
      <header>
        <p className="eyebrow">WORKSPACE</p>
        <h1>Executive dashboard</h1>
        <p>Starter shell for the Synaptria operating workspace.</p>
      </header>
      <section className="grid">
        {cards.map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>
    </main>
  );
}
