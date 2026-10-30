import { appConfig, riskRoute } from '@synaptria/config';
import { riskId, type RiskId } from '@synaptria/core';
import type { RiskCategory, RiskImpact, RiskProbability, RiskStatus } from '@synaptria/domain/risks';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const RISK_STATUS_LABELS: Record<RiskStatus, string> = {
  OPEN: 'Open',
  MITIGATING: 'Mitigating',
  ACCEPTED: 'Accepted',
  CLOSED: 'Closed',
};

const RISK_CATEGORY_LABELS: Record<RiskCategory, string> = {
  SCIENTIFIC: 'Scientific',
  CLINICAL: 'Clinical',
  REGULATORY: 'Regulatory',
  CMC: 'CMC',
  MANUFACTURING: 'Manufacturing',
  FINANCIAL: 'Financial',
  VENDOR: 'Vendor',
  OPERATIONAL: 'Operational',
  LEGAL: 'Legal',
  IP: 'IP',
  PEOPLE: 'People',
  OTHER: 'Other',
};

const RISK_PROBABILITY_LABELS: Record<RiskProbability, string> = {
  RARE: 'Rare',
  UNLIKELY: 'Unlikely',
  POSSIBLE: 'Possible',
  LIKELY: 'Likely',
  ALMOST_CERTAIN: 'Almost certain',
};

const RISK_IMPACT_LABELS: Record<RiskImpact, string> = {
  NEGLIGIBLE: 'Negligible',
  MINOR: 'Minor',
  MODERATE: 'Moderate',
  MAJOR: 'Major',
  SEVERE: 'Severe',
};

export function formatRiskStatus(status: RiskStatus): string {
  return RISK_STATUS_LABELS[status];
}

export function formatRiskCategory(category: RiskCategory): string {
  return RISK_CATEGORY_LABELS[category];
}

export function formatRiskProbability(probability: RiskProbability): string {
  return RISK_PROBABILITY_LABELS[probability];
}

export function formatRiskImpact(impact: RiskImpact): string {
  return RISK_IMPACT_LABELS[impact];
}

export function formatRiskDate(date: Date): string {
  return new Intl.DateTimeFormat(appConfig.defaultLocale, { dateStyle: 'medium' }).format(date);
}

export function getRiskDetailHref(id: RiskId): string {
  return riskRoute(id);
}

export function parseRiskRouteParam(raw: string | undefined): RiskId | null {
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim();
  if (!UUID_PATTERN.test(normalized)) return null;
  return riskId(normalized);
}
