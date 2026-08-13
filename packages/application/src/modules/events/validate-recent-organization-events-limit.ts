import { MAX_PAGE_SIZE } from '@synaptria/core/pagination';

import { ApplicationError } from '../../shared/application-error';

export const DEFAULT_RECENT_ORGANIZATION_EVENTS_LIMIT = 25;

export function validateRecentOrganizationEventsLimit(limit: number): number {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new ApplicationError({
      code: 'VALIDATION_FAILED',
      message: 'Recent organization event limit must be a positive integer.',
      details: { limit },
    });
  }

  if (limit > MAX_PAGE_SIZE) {
    throw new ApplicationError({
      code: 'VALIDATION_FAILED',
      message: `Recent organization event limit cannot exceed ${MAX_PAGE_SIZE}.`,
      details: { limit, maxLimit: MAX_PAGE_SIZE },
    });
  }

  return limit;
}
