import { appConfig, primaryNavigation } from "@synaptria/config";
import { Card, Stack } from "@synaptria/ui";

const cards = [
  ["Programs", "0 active"],
  ["Projects", "0 in progress"],
  ["Open risks", "0"],
  ["Pending decisions", "0"],
] as const;

export default function DashboardPage() {
  return (
    <main className="dashboard">
      <header>
        <p className="eyebrow">WORKSPACE</p>
        <h1>Executive dashboard</h1>
        <p>Starter shell for the {appConfig.name} operating workspace.</p>
      </header>

      <section className="grid" aria-label="Workspace metrics">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <Stack gap={12}>
              <span>{label}</span>
              <strong>{value}</strong>
            </Stack>
          </Card>
        ))}
      </section>

      <section className="dashboard-section">
        <h2>Planned modules</h2>

        <div className="module-list">
          {primaryNavigation.map((item) => (
            <Card key={item.href}>
              <Stack gap={8}>
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </Stack>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
