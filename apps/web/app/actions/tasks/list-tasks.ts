'use server';

import type { ListTasksOutput } from '@synaptria/application';

import { toListTasksContext } from '../../../lib/task-context';
import { getTaskService } from '../../../lib/task-service';
import { getRequestContext } from '../../../lib/request-context';

export async function listTasksAction(): Promise<ListTasksOutput> {
  const context = await getRequestContext();

  return getTaskService().listTasks(toListTasksContext(context));
}
