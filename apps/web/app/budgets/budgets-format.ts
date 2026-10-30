import { appConfig, budgetRoute } from '@synaptria/config';
import { budgetId, type BudgetId } from '@synaptria/core';
import type { BudgetPeriodType, BudgetStatus } from '@synaptria/domain/budgets';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = {
  DRAFT: 'Draft',
  APPROVED: 'Approved',
  ACTIVE: 'Active',
  CLOSED: 'Closed',
  ARCHIVED: 'Archived',
};

const BUDGET_PERIOD_TYPE_LABELS: Record<BudgetPeriodType, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUAL: 'Annual',
  CUSTOM: 'Custom',
};

export function formatBudgetStatus(status: BudgetStatus): string {
  return BUDGET_STATUS_LABELS[status];
}

export function formatBudgetPeriodType(periodType: BudgetPeriodType): string {
  return BUDGET_PERIOD_TYPE_LABELS[periodType];
}

export function formatBudgetDate(date: Date): string {
  return new Intl.DateTimeFormat(appConfig.defaultLocale, { dateStyle: 'medium' }).format(date);
}

export function getBudgetDetailHref(id: BudgetId): string {
  return budgetRoute(id);
}

export function parseBudgetRouteParam(raw: string | undefined): BudgetId | null {
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim();
  if (!UUID_PATTERN.test(normalized)) return null;
  return budgetId(normalized);
}
