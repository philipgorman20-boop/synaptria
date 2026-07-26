'use server';

import { ApplicationError, type ListProjectMilestonesOutput } from '@synaptria/application';

import { toListProjectMilestonesContext } from '../../../lib/milestone-context';
import { getMilestoneService } from '../../../lib/milestone-service';
import { parseProjectRouteParamForMilestones } from '../../../lib/milestones-format';
import { getRequestContext } from '../../../lib/request-context';

export async function listProjectMilestonesAction(
  rawProjectId: string,
): Promise<ListProjectMilestonesOutput> {
  const projectId = parseProjectRouteParamForMilestones(rawProjectId);

  if (projectId === null) {
    throw new ApplicationError({
      code: 'VALIDATION_FAILED',
      message: 'A valid project identifier is required.',
      details: { field: 'projectId' },
    });
  }

  const context = await getRequestContext();

  return getMilestoneService().listProjectMilestones(
    toListProjectMilestonesContext(context),
    { projectId },
  );
}
