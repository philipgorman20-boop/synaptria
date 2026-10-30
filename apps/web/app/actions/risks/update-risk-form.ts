import { ApplicationError } from '@synaptria/application';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import type { RiskCategory, RiskImpact, RiskProbability, RiskStatus } from '@synaptria/domain/risks';

export interface UpdateRiskActionState {
  readonly status: 'idle' | 'success' | 'error';
  readonly message?: string;
  readonly fieldErrors?: Readonly<{
    title?: string;
    category?: string;
    status?: string;
  }>;
  readonly values?: Readonly<{
    title: string;
    category: string;
    status: string;
    probability: string;
    impact: string;
    description: string;
    mitigationPlan: string;
    contingencyPlan: string;
    programId: string;
    projectId: string;
  }>;
}

export interface UpdateRiskFormValues {
  readonly title: string;
  readonly category: string;
  readonly status: string;
  readonly probability: string;
  readonly impact: string;
  readonly description: string;
  readonly mitigationPlan: string;
  readonly contingencyPlan: string;
  readonly programId: string;
  readonly projectId: string;
}

export const initialUpdateRiskState: UpdateRiskActionState = { status: 'idle' };

export function readUpdateRiskFormValues(formData: FormData): UpdateRiskFormValues {
  return {
    title: readText(formData, 'title'),
    category: readText(formData, 'category'),
    status: readText(formData, 'status'),
    probability: readText(formData, 'probability'),
    impact: readText(formData, 'impact'),
    description: readText(formData, 'description'),
    mitigationPlan: readText(formData, 'mitigationPlan'),
    contingencyPlan: readText(formData, 'contingencyPlan'),
    programId: readText(formData, 'programId'),
    projectId: readText(formData, 'projectId'),
  };
}

export function validateUpdateRiskFormValues(
  values: UpdateRiskFormValues,
): UpdateRiskActionState | undefined {
  const fieldErrors: { title?: string; category?: string } = {};

  if (values.title.trim().length === 0) {
    fieldErrors.title = 'Risk title is required.';
  }

  if (values.category.trim().length === 0) {
    fieldErrors.category = 'Category is required.';
  }

  if (Object.keys(fieldErrors).length === 0) return undefined;

  return {
    status: 'error',
    message: 'Correct the highlighted fields and try again.',
    fieldErrors,
    values,
  };
}

export function mapUpdateRiskActionError(
  error: unknown,
  values: UpdateRiskFormValues,
): UpdateRiskActionState | undefined {
  if (error instanceof AuthorizationDeniedError) {
    return { status: 'error', message: 'You do not have permission to update risks.', values };
  }

  if (error instanceof ApplicationError) {
    return { status: 'error', message: error.message, values };
  }

  return undefined;
}

export function isRiskCategory(value: string): value is RiskCategory {
  return [
    'SCIENTIFIC', 'CLINICAL', 'REGULATORY', 'CMC', 'MANUFACTURING',
    'FINANCIAL', 'VENDOR', 'OPERATIONAL', 'LEGAL', 'IP', 'PEOPLE', 'OTHER',
  ].includes(value);
}

export function isRiskStatus(value: string): value is RiskStatus {
  return ['OPEN', 'MITIGATING', 'ACCEPTED', 'CLOSED'].includes(value);
}

export function isRiskProbability(value: string): value is RiskProbability {
  return ['RARE', 'UNLIKELY', 'POSSIBLE', 'LIKELY', 'ALMOST_CERTAIN'].includes(value);
}

export function isRiskImpact(value: string): value is RiskImpact {
  return ['NEGLIGIBLE', 'MINOR', 'MODERATE', 'MAJOR', 'SEVERE'].includes(value);
}

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}
