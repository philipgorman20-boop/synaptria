import type { MissionControlRestrictedSlice } from '../mission-control/constants';

export function isRecommendationSliceRestricted(
  slice: MissionControlRestrictedSlice,
  restrictedSlices: readonly MissionControlRestrictedSlice[],
): boolean {
  return restrictedSlices.includes(slice);
}

export function canEvaluateTaskRecommendations(
  restrictedSlices: readonly MissionControlRestrictedSlice[],
): boolean {
  return !isRecommendationSliceRestricted('tasks', restrictedSlices);
}

export function canEvaluateMilestoneRecommendations(
  restrictedSlices: readonly MissionControlRestrictedSlice[],
): boolean {
  return !isRecommendationSliceRestricted('milestones', restrictedSlices);
}

export function canEvaluateProjectRecommendations(
  restrictedSlices: readonly MissionControlRestrictedSlice[],
): boolean {
  return !isRecommendationSliceRestricted('projects', restrictedSlices);
}
