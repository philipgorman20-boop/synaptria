import type { Clock } from '@synaptria/core';

import {
  MISSION_CONTROL_DEEPLY_OVERDUE_DAYS,
  MISSION_CONTROL_DUE_SOON_DAYS,
} from './constants';

export function startOfUtcDay(clock: Clock): Date {
  const now = clock.now();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function addUtcDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function isOverdue(plannedEndDate: Date | undefined, clock: Clock): boolean {
  if (plannedEndDate === undefined) {
    return false;
  }

  const today = startOfUtcDay(clock);
  const dueDay = startOfUtcDayFromDate(plannedEndDate);
  return dueDay.getTime() < today.getTime();
}

export function isDueSoon(plannedEndDate: Date | undefined, clock: Clock): boolean {
  if (plannedEndDate === undefined) {
    return false;
  }

  if (isOverdue(plannedEndDate, clock)) {
    return false;
  }

  const today = startOfUtcDay(clock);
  const dueDay = startOfUtcDayFromDate(plannedEndDate);
  const dueSoonEnd = addUtcDays(today, MISSION_CONTROL_DUE_SOON_DAYS);
  return dueDay.getTime() <= dueSoonEnd.getTime();
}

export function daysPastDue(plannedEndDate: Date | undefined, clock: Clock): number {
  if (plannedEndDate === undefined || !isOverdue(plannedEndDate, clock)) {
    return 0;
  }

  const today = startOfUtcDay(clock);
  const dueDay = startOfUtcDayFromDate(plannedEndDate);
  return Math.floor((today.getTime() - dueDay.getTime()) / (24 * 60 * 60 * 1000));
}

export function isDeeplyOverdue(plannedEndDate: Date | undefined, clock: Clock): boolean {
  return daysPastDue(plannedEndDate, clock) >= MISSION_CONTROL_DEEPLY_OVERDUE_DAYS;
}

export function toIsoDate(date: Date): string {
  return date.toISOString();
}

function startOfUtcDayFromDate(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
