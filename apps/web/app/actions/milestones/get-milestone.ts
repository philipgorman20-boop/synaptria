'use server';

import {
  ApplicationError,
  type GetMilestoneOutput,
} from '@synaptria/application';

import { toGetMilestoneContext } from '../../../lib/milestone-context';
import { getMilestoneService } from '../../../lib/milestone-service';
import { parseMilestoneRouteParam } from '../../../lib/milestones-format';
import { getRequestContext } from '../../../lib/request-context';

export async function getMilestoneAction(
  rawMilestoneId: string,
): Promise<GetMilestoneOutput> {
  const milestoneId = parseMilestoneRouteParam(rawMilestoneId);

  if (milestoneId === null) {
    throw new ApplicationError({
      code: 'VALIDATION_FAILED',
      message: 'A valid milestone identifier is required.',
      details: { field: 'milestoneId' },
    });
  }

  const context = await getRequestContext();

  return getMilestoneService().getMilestone(toGetMilestoneContext(context), {
    milestoneId,
  });
}
