'use server';

import {
  ApplicationError,
  type ListMilestoneTasksOutput,
} from '@synaptria/application';

import { toListMilestoneTasksContext } from '../../../lib/task-context';
import { getTaskService } from '../../../lib/task-service';
import { parseMilestoneRouteParam } from '../../../lib/milestones-format';
import { getRequestContext } from '../../../lib/request-context';

export async function listMilestoneTasksAction(
  rawMilestoneId: string,
): Promise<ListMilestoneTasksOutput> {
  const milestoneId = parseMilestoneRouteParam(rawMilestoneId);

  if (milestoneId === null) {
    throw new ApplicationError({
      code: 'VALIDATION_FAILED',
      message: 'A valid milestone identifier is required.',
      details: { field: 'milestoneId' },
    });
  }

  const context = await getRequestContext();

  return getTaskService().listMilestoneTasks(
    toListMilestoneTasksContext(context),
    { milestoneId },
  );
}
