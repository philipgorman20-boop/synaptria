import type { GetRecommendationsContext } from './generate-recommendations';
import { GenerateRecommendationsUseCase } from './generate-recommendations';

export class RecommendationService {
  constructor(
    private readonly generateRecommendationsUseCase: GenerateRecommendationsUseCase,
  ) {}

  getRecommendations(context: GetRecommendationsContext) {
    return this.generateRecommendationsUseCase.execute(context);
  }
}
