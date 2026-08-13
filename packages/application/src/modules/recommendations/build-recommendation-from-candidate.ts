import { calculateRecommendationConfidence } from './confidence';
import { collectSnapshotEvidenceForEntities } from './evidence-keys';
import { buildRecommendationId } from './recommendation-id';
import type { RecommendationRuleCandidate } from './rules/types';
import type { Recommendation } from './types';
import type { DailyBriefingSnapshot } from '../daily-briefing/types';

export function buildRecommendationFromCandidate(input: {
  readonly candidate: RecommendationRuleCandidate;
  readonly snapshot: DailyBriefingSnapshot;
  readonly generatedAt: Date;
}): Recommendation | null {
  const evidence = collectSnapshotEvidenceForEntities(
    input.snapshot,
    input.candidate.evidenceEntities,
  );

  if (evidence.length === 0) {
    return null;
  }

  const confidence = calculateRecommendationConfidence({
    evidenceCount: evidence.length,
    corroboratingSignalCount: input.candidate.corroboratingSignalCount,
    completenessStatus: input.snapshot.completeness.status,
  });

  return {
    id: buildRecommendationId(input.candidate.ruleId, input.candidate.targetEntity),
    type: input.candidate.type,
    ruleId: input.candidate.ruleId,
    title: input.candidate.title,
    rationale: input.candidate.rationale,
    priority: input.candidate.priority,
    targetEntity: input.candidate.targetEntity,
    proposedAction: {
      description: input.candidate.proposedActionDescription,
    },
    evidence,
    confidence,
    generatedAt: input.generatedAt,
    status: 'proposed',
    metadata: {
      ruleId: input.candidate.ruleId,
      sourceSnapshotGeneratedAt: input.snapshot.generatedAt,
      corroboratingSignalCount: input.candidate.corroboratingSignalCount,
    },
  };
}
