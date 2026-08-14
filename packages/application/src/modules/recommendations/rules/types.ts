import type { OrganizationId } from '@synaptria/core';
import type { EntityReference } from '@synaptria/domain/context';

import type { DailyBriefingSnapshot } from '../../daily-briefing/types';
import type { RecommendationRuleId } from '../constants';
import type { Recommendation, RecommendationProposedMutation } from '../types';

export interface RecommendationRuleContext {
  readonly snapshot: DailyBriefingSnapshot;
  readonly organizationId: OrganizationId;
  readonly generatedAt: Date;
}

export interface RecommendationRuleCandidate {
  readonly ruleId: RecommendationRuleId;
  readonly type: Recommendation['type'];
  readonly title: string;
  readonly rationale: string;
  readonly priority: Recommendation['priority'];
  readonly targetEntity: EntityReference;
  readonly proposedActionDescription: string;
  readonly proposedMutation?: RecommendationProposedMutation;
  readonly evidenceEntities: readonly EntityReference[];
  readonly corroboratingSignalCount: number;
}

export interface RecommendationRule {
  readonly ruleId: RecommendationRuleId;
  evaluate(context: RecommendationRuleContext): readonly RecommendationRuleCandidate[];
}
