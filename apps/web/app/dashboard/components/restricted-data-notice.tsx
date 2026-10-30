import type { MissionControlRestrictedSlice } from '@synaptria/application/mission-control';

import {
  formatRestrictedSliceLabels,
  MISSION_CONTROL_RESTRICTED_NOTICE,
} from '../mission-control-format';

export interface RestrictedDataNoticeProps {
  readonly restrictedSlices: readonly MissionControlRestrictedSlice[];
}

export function RestrictedDataNotice({ restrictedSlices }: RestrictedDataNoticeProps) {
  if (restrictedSlices.length === 0) {
    return null;
  }

  return (
    <aside
      className="mission-control-restricted-notice"
      aria-label="Restricted Mission Control data"
    >
      <p>
        {MISSION_CONTROL_RESTRICTED_NOTICE} Unavailable:{' '}
        {formatRestrictedSliceLabels(restrictedSlices)}.
      </p>
    </aside>
  );
}
