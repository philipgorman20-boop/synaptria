import { ApplicationError } from '../../shared/application-error';
import { buildRecommendationEvidenceKeySet } from './evidence-keys';
import type { Recommendation } from './types';

export function validateRecommendationsHaveEvidence(
  recommendations: readonly Recommendation[],
): void {
  const issues: string[] = [];

  recommendations.forEach((recommendation, index) => {
    if (recommendation.evidence.length === 0) {
      issues.push(`recommendations[${index}] must include at least one evidence reference.`);
      return;
    }

    const allowedKeys = buildRecommendationEvidenceKeySet(recommendation.evidence);
    if (allowedKeys.size !== recommendation.evidence.length) {
      issues.push(`recommendations[${index}] contains duplicate evidence references.`);
    }
  });

  if (issues.length > 0) {
    throw new ApplicationError({
      code: 'VALIDATION_FAILED',
      message: 'Generated recommendations failed evidence validation.',
      details: { issues },
    });
  }
}
