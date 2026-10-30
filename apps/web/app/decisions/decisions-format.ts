import { appConfig, decisionRoute } from '@synaptria/config';
import { decisionId, type DecisionId } from '@synaptria/core';
import type { DecisionStatus } from '@synaptria/domain/decisions';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DECISION_STATUS_LABELS: Record<DecisionStatus, string> = {
  PROPOSED: 'Proposed',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  SUPERSEDED: 'Superseded',
};

export function formatDecisionStatus(status: DecisionStatus): string {
  return DECISION_STATUS_LABELS[status];
}

export function formatDecisionDate(date: Date): string {
  return new Intl.DateTimeFormat(appConfig.defaultLocale, { dateStyle: 'medium' }).format(date);
}

export function getDecisionDetailHref(id: DecisionId): string {
  return decisionRoute(id);
}

export function parseDecisionRouteParam(raw: string | undefined): DecisionId | null {
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim();
  if (!UUID_PATTERN.test(normalized)) return null;
  return decisionId(normalized);
}
