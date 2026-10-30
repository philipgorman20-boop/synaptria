export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export const PRIORITIES = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
] as const satisfies readonly Priority[];

export function isPriority(value: string): value is Priority {
  return (PRIORITIES as readonly string[]).includes(value);
}
