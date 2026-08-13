import { ApplicationError } from '../../../shared/application-error';
import { buildDailyBriefingEvidenceKeySet } from '../evidence-keys';
import type { DailyBriefingSnapshot } from '../types';
import {
  DAILY_BRIEFING_NARRATIVE_FACTUAL_ITEM_FIELDS,
  type DailyBriefingNarrativeFactualItemField,
  type DailyBriefingNarrativeV0StructuredOutput,
  type GroundedNarrativeBlock,
} from './schema';
import { dailyBriefingSnapshotRequiresNarrativeEvidence } from './requires-narrative-evidence';

export function validateDailyBriefingNarrativeEvidence(input: {
  readonly narrative: DailyBriefingNarrativeV0StructuredOutput;
  readonly snapshot: DailyBriefingSnapshot;
}): void {
  const allowedKeys = buildDailyBriefingEvidenceKeySet(input.snapshot.evidence);
  const requiresEvidence = dailyBriefingSnapshotRequiresNarrativeEvidence(input.snapshot);
  const issues: string[] = [];

  validateGroundedBlock({
    field: 'headline',
    block: input.narrative.headline,
    allowedKeys,
    requiresEvidence,
    issues,
  });
  validateGroundedBlock({
    field: 'executiveSummary',
    block: input.narrative.executiveSummary,
    allowedKeys,
    requiresEvidence,
    issues,
  });

  for (const field of DAILY_BRIEFING_NARRATIVE_FACTUAL_ITEM_FIELDS) {
    validateFactualItems({
      field,
      items: input.narrative[field],
      allowedKeys,
      issues,
    });
  }

  if (issues.length > 0) {
    throw new ApplicationError({
      code: 'VALIDATION_FAILED',
      message: 'Daily Briefing narrative contains invalid or ungrounded evidence references.',
      details: { issues },
    });
  }
}

function validateGroundedBlock(input: {
  readonly field: string;
  readonly block: GroundedNarrativeBlock;
  readonly allowedKeys: ReadonlySet<string>;
  readonly requiresEvidence: boolean;
  readonly issues: string[];
}): void {
  if (input.block.evidenceKeys.length === 0) {
    if (input.requiresEvidence) {
      input.issues.push(`${input.field} must include at least one evidenceKey.`);
    }
    return;
  }

  for (const evidenceKey of input.block.evidenceKeys) {
    if (!input.allowedKeys.has(evidenceKey)) {
      input.issues.push(`${input.field} references unknown evidenceKey "${evidenceKey}".`);
    }
  }
}

function validateFactualItems(input: {
  readonly field: DailyBriefingNarrativeFactualItemField;
  readonly items: DailyBriefingNarrativeV0StructuredOutput[DailyBriefingNarrativeFactualItemField];
  readonly allowedKeys: ReadonlySet<string>;
  readonly issues: string[];
}): void {
  input.items.forEach((item, index) => {
    if (item.evidenceKeys.length === 0) {
      input.issues.push(`${input.field}[${index}] must include at least one evidenceKey.`);
      return;
    }

    for (const evidenceKey of item.evidenceKeys) {
      if (!input.allowedKeys.has(evidenceKey)) {
        input.issues.push(
          `${input.field}[${index}] references unknown evidenceKey "${evidenceKey}".`,
        );
      }
    }
  });
}
