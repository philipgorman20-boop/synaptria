import type { GetRecommendationsContext } from '../recommendations/generate-recommendations';
import type { RecommendationsSnapshot } from '../recommendations/types';

/** Minimal read contract for current deterministic recommendations. */
export type RecommendationSnapshotReaderContext = GetRecommendationsContext;

export interface RecommendationSnapshotReader {
  getRecommendations(
    context: RecommendationSnapshotReaderContext,
  ): Promise<RecommendationsSnapshot>;
}
