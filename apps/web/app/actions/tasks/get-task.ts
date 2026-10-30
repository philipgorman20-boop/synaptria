'use server';

import {
  ApplicationError,
  type GetTaskOutput,
} from '@synaptria/application';

import { toGetTaskContext } from '../../../lib/task-context';
import { getTaskService } from '../../../lib/task-service';
import { parseTaskRouteParam } from '../../../lib/tasks-format';
import { getRequestContext } from '../../../lib/request-context';

export async function getTaskAction(
  rawTaskId: string,
): Promise<GetTaskOutput> {
  const taskId = parseTaskRouteParam(rawTaskId);

  if (taskId === null) {
    throw new ApplicationError({
      code: 'VALIDATION_FAILED',
      message: 'A valid task identifier is required.',
      details: { field: 'taskId' },
    });
  }

  const context = await getRequestContext();

  return getTaskService().getTask(toGetTaskContext(context), {
    taskId,
  });
}
