import type { DailyBriefingNarrative, DailyBriefingSnapshot } from '@synaptria/application';
import { ApplicationError } from '@synaptria/application';
import { ProviderError } from '@synaptria/ai';
import type { GetDailyBriefingSnapshotContext } from '@synaptria/application';

import { getDailyBriefingNarrativeService } from './daily-briefing-narrative-service';
import { getDailyBriefingService } from './daily-briefing-service';

export const DAILY_BRIEFING_AI_UNAVAILABLE_MESSAGE =
  'AI summary unavailable. Operational briefing data is still current.';

export interface DailyBriefingPageData {
  readonly snapshot: DailyBriefingSnapshot;
  readonly narrative: DailyBriefingNarrative | null;
  readonly aiSummaryUnavailable: boolean;
}

export interface DailyBriefingLoaderDependencies {
  readonly getSnapshot: (
    context: GetDailyBriefingSnapshotContext,
  ) => Promise<DailyBriefingSnapshot>;
  readonly generateNarrative: (input: {
    readonly snapshot: DailyBriefingSnapshot;
  }) => Promise<DailyBriefingNarrative>;
}

const defaultDependencies: DailyBriefingLoaderDependencies = {
  getSnapshot(context) {
    return getDailyBriefingService().getSnapshot(context);
  },
  generateNarrative(input) {
    return getDailyBriefingNarrativeService().generateNarrative(input);
  },
};

export function isExpectedNarrativeGenerationFailure(error: unknown): boolean {
  return error instanceof ApplicationError || error instanceof ProviderError;
}

export async function loadDailyBriefingPageData(
  context: GetDailyBriefingSnapshotContext,
  dependencies: DailyBriefingLoaderDependencies = defaultDependencies,
): Promise<DailyBriefingPageData> {
  const snapshot = await dependencies.getSnapshot(context);

  try {
    const narrative = await dependencies.generateNarrative({ snapshot });
    return {
      snapshot,
      narrative,
      aiSummaryUnavailable: false,
    };
  } catch (error) {
    if (!isExpectedNarrativeGenerationFailure(error)) {
      throw error;
    }

    return {
      snapshot,
      narrative: null,
      aiSummaryUnavailable: true,
    };
  }
}
