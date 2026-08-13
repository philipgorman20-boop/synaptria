import { DAILY_BRIEFING_AI_UNAVAILABLE_MESSAGE } from '../../../lib/daily-briefing-loader';

export interface DailyBriefingAiStatusProps {
  readonly aiSummaryUnavailable: boolean;
}

export function DailyBriefingAiStatus({ aiSummaryUnavailable }: DailyBriefingAiStatusProps) {
  if (!aiSummaryUnavailable) {
    return null;
  }

  return (
    <aside
      className="daily-briefing-ai-status"
      aria-label="AI summary status"
      role="status"
    >
      <p>{DAILY_BRIEFING_AI_UNAVAILABLE_MESSAGE}</p>
    </aside>
  );
}
