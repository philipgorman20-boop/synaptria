'use server';

import {
  milestoneRoute,
  milestoneTasksRoute,
  projectRoute,
  routes,
  taskRoute,
} from '@synaptria/config';
import type { MilestoneId, TaskId } from '@synaptria/core';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { toGetMilestoneContext } from '../../../lib/milestone-context';
import { getMilestoneService } from '../../../lib/milestone-service';
import { toCreateTaskContext } from '../../../lib/task-context';
import { getTaskService } from '../../../lib/task-service';
import { getRequestContext } from '../../../lib/request-context';

import {
  mapCreateTaskActionError,
  readCreateTaskFormValues,
  toCreateTaskInput,
  validateCreateTaskFormValues,
  type CreateTaskActionState,
} from './create-task-form';

export async function createTaskAction(
  expectedMilestoneId: MilestoneId,
  _previousState: CreateTaskActionState,
  formData: FormData,
): Promise<CreateTaskActionState> {
  const values = readCreateTaskFormValues(formData);
  const validation = validateCreateTaskFormValues(values);

  if (validation !== undefined) {
    return validation;
  }

  const context = await getRequestContext();

  let createdTaskId: TaskId;
  let milestoneIdForRevalidation: MilestoneId;

  try {
    const { task } = await getTaskService().createTask(
      toCreateTaskContext(context),
      toCreateTaskInput(expectedMilestoneId, values),
    );

    createdTaskId = task.id;
    milestoneIdForRevalidation = task.milestoneId;
  } catch (error) {
    const mapped = mapCreateTaskActionError(error, values);
    if (mapped !== undefined) {
      return mapped;
    }

    return {
      status: 'error',
      message: 'The task could not be created. Please try again.',
      values,
    };
  }

  const { milestone } = await getMilestoneService().getMilestone(
    toGetMilestoneContext(context),
    { milestoneId: milestoneIdForRevalidation },
  );

  revalidatePath(routes.projects);
  revalidatePath(routes.dashboard);
  revalidatePath(projectRoute(milestone.projectId));
  revalidatePath(milestoneRoute(milestone.projectId, milestone.id));
  revalidatePath(milestoneTasksRoute(milestone.projectId, milestone.id));

  redirect(taskRoute(milestone.projectId, milestone.id, createdTaskId));
}
