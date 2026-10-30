'use server';

import { milestoneRoute, projectMilestonesRoute, projectRoute, routes } from '@synaptria/config';
import type { MilestoneId, ProjectId } from '@synaptria/core';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { toCreateMilestoneContext } from '../../../lib/milestone-context';
import { getMilestoneService } from '../../../lib/milestone-service';
import { getRequestContext } from '../../../lib/request-context';

import {
  mapCreateMilestoneActionError,
  readCreateMilestoneFormValues,
  toCreateMilestoneInput,
  validateCreateMilestoneFormValues,
  type CreateMilestoneActionState,
} from './create-milestone-form';

export async function createMilestoneAction(
  _previousState: CreateMilestoneActionState,
  formData: FormData,
): Promise<CreateMilestoneActionState> {
  const values = readCreateMilestoneFormValues(formData);
  const validation = validateCreateMilestoneFormValues(values);

  if (validation !== undefined) {
    return validation;
  }

  const context = await getRequestContext();

  let createdMilestoneId: MilestoneId;
  let projectIdForRevalidation: ProjectId;

  try {
    const { milestone } = await getMilestoneService().createMilestone(
      toCreateMilestoneContext(context),
      toCreateMilestoneInput(values),
    );

    createdMilestoneId = milestone.id;
    projectIdForRevalidation = milestone.projectId;
  } catch (error) {
    const mapped = mapCreateMilestoneActionError(error, values);
    if (mapped !== undefined) {
      return mapped;
    }

    return {
      status: 'error',
      message: 'The milestone could not be created. Please try again.',
      values,
    };
  }

  revalidatePath(routes.projects);
  revalidatePath(routes.dashboard);
  revalidatePath(projectRoute(projectIdForRevalidation));
  revalidatePath(projectMilestonesRoute(projectIdForRevalidation));

  redirect(milestoneRoute(projectIdForRevalidation, createdMilestoneId));
}
