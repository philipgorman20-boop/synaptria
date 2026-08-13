export function buildActionProposalId(recommendationId: string): string {
  return `ap:${recommendationId}`;
}

export function parseActionProposalRecommendationId(actionProposalId: string): string | null {
  if (!actionProposalId.startsWith('ap:')) {
    return null;
  }

  const recommendationId = actionProposalId.slice('ap:'.length);
  return recommendationId.length > 0 ? recommendationId : null;
}
