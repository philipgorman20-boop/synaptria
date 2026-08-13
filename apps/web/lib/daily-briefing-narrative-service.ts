import {
  DailyBriefingNarrativeService,
  GenerateDailyBriefingNarrativeUseCase,
} from '@synaptria/application';
import { getAIProviderService } from './ai-provider-service';

const dailyBriefingNarrativeService = new DailyBriefingNarrativeService(
  new GenerateDailyBriefingNarrativeUseCase(getAIProviderService()),
);

/** Shared server-side composition root for Daily Briefing narrative rendering. */
export function getDailyBriefingNarrativeService(): DailyBriefingNarrativeService {
  return dailyBriefingNarrativeService;
}
