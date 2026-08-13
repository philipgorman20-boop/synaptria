export type DemoDateOffsetKind =
  | 'deep_overdue'
  | 'recent_overdue'
  | 'due_soon'
  | 'future'
  | 'completed_past';

const DEMO_DATE_OFFSETS: Record<DemoDateOffsetKind, { readonly min: number; readonly max: number }> =
  {
    deep_overdue: { min: -20, max: -10 },
    recent_overdue: { min: -5, max: -2 },
    due_soon: { min: 1, max: 6 },
    future: { min: 14, max: 45 },
    completed_past: { min: -35, max: -15 },
  };

/** Normalizes the seed reference instant to a stable UTC midday anchor. */
export function normalizeSeedReferenceDate(now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0, 0),
  );
}

/** Adds whole UTC days to a reference date. */
export function addUtcDays(reference: Date, days: number): Date {
  const result = new Date(reference);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/** Deterministic offset day within the configured range for a scenario category. */
export function resolveDemoDateOffsetDay(
  kind: DemoDateOffsetKind,
  slot: number,
): number {
  const range = DEMO_DATE_OFFSETS[kind];
  const span = range.max - range.min + 1;
  return range.min + (Math.abs(slot) % span);
}

/** Resolves a planned or actual date from the seed reference and offset kind. */
export function resolveDemoDate(
  reference: Date,
  kind: DemoDateOffsetKind,
  slot: number,
): Date {
  return addUtcDays(reference, resolveDemoDateOffsetDay(kind, slot));
}

/** Recent event timestamps spread over the last few hours/days for activity feed coverage. */
export function resolveRecentEventDate(reference: Date, index: number): Date {
  const hoursAgo = [2, 5, 8, 14, 20, 28, 36, 48, 60, 72, 84, 96, 108, 120, 132];
  const offsetHours = hoursAgo[index % hoursAgo.length] ?? 24;
  return new Date(reference.getTime() - offsetHours * 60 * 60 * 1000);
}
