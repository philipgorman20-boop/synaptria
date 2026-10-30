import type { AIProviderRequest, AIProviderResponse } from '@synaptria/ai';

/** Application-owned port for AI provider execution used by Daily Briefing rendering. */
export interface DailyBriefingAIProviderPort {
  execute(request: AIProviderRequest): Promise<AIProviderResponse>;
}
