'use server';

import { programRoute, projectRoute, routes } from '@synaptria/config';
import type { ProgramId, ProjectId } from '@synaptria/core';
import { programId } from '@synaptria/core';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { toCreateProjectContext } from '../../../lib/project-context';
import { getRequestContext } from '../../../lib/request-context';
import { getProjectService } from '../../../lib/project-service';

import {
  mapCreateProjectActionError,
  readCreateProjectFormValues,
  toCreateProjectInput,
  validateCreateProjectFormValues,
  type CreateProjectActionState,
} from './create-project-form';

export async function createProjectAction(
  _previousState: CreateProjectActionState,
  formData: FormData,
): Promise<CreateProjectActionState> {
  const values = readCreateProjectFormValues(formData);
  const validation = validateCreateProjectFormValues(values);

  if (validation !== undefined) {
    return validation;
  }

  let createdProjectId: ProjectId | undefined;
  let programIdForRevalidation: ProgramId | undefined;
  const programIdValue = values.programId.trim();

  if (programIdValue.length > 0) {
    programIdForRevalidation = programId(programIdValue);
  }

  try {
    const context = await getRequestContext();
    const { project } = await getProjectService().createProject(
      toCreateProjectContext(context),
      toCreateProjectInput(values),
    );

    createdProjectId = project.id;

    revalidatePath(routes.projects);
    revalidatePath(routes.dashboard);

    if (programIdForRevalidation !== undefined) {
      revalidatePath(programRoute(programIdForRevalidation));
    }
  } catch (error) {
    const mapped = mapCreateProjectActionError(error, values);
    if (mapped !== undefined) {
      return mapped;
    }

    return {
      status: 'error',
      message: 'The project could not be created. Please try again.',
      values,
    };
  }

  redirect(projectRoute(createdProjectId));
}
