import type { EntityReference } from '@synaptria/domain/context';

import type { RecommendationRuleId } from './constants';
import { entityEvidenceKey } from './evidence-keys';

export function buildRecommendationId(
  ruleId: RecommendationRuleId,
  targetEntity: EntityReference,
): string {
  return `rec:${ruleId}:${entityEvidenceKey(targetEntity)}`;
}
