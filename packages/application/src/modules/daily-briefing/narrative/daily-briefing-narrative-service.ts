import type { GenerateDailyBriefingNarrativeInput } from './generate-daily-briefing-narrative';
import { GenerateDailyBriefingNarrativeUseCase } from './generate-daily-briefing-narrative';

export class DailyBriefingNarrativeService {
  constructor(
    private readonly generateDailyBriefingNarrativeUseCase: GenerateDailyBriefingNarrativeUseCase,
  ) {}

  generateNarrative(input: GenerateDailyBriefingNarrativeInput) {
    return this.generateDailyBriefingNarrativeUseCase.execute(input);
  }
}
