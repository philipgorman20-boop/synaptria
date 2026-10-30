import type { Clock } from '@synaptria/core';

import {
  DAILY_BRIEFING_DEFAULT_LOOKBACK_HOURS,
  DAILY_BRIEFING_MILLISECONDS_PER_HOUR,
} from './constants';
import type { DailyBriefingWindow } from './types';

export function resolveDailyBriefingWindow(input: {
  readonly clock: Clock;
  readonly lookbackHours?: number;
}): DailyBriefingWindow {
  const lookbackHours = input.lookbackHours ?? DAILY_BRIEFING_DEFAULT_LOOKBACK_HOURS;
  const endsAt = input.clock.now();
  const startsAt = new Date(
    endsAt.getTime() - lookbackHours * DAILY_BRIEFING_MILLISECONDS_PER_HOUR,
  );

  return {
    lookbackHours,
    startsAt,
    endsAt,
  };
}
