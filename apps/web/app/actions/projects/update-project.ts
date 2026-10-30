'use server';

import { revalidatePath } from 'next/cache';
import { projectRoute, routes } from '@synaptria/config';
import { programId as toProgramId, type ProjectId } from '@synaptria/core';

import { toUpdateProjectContext } from '../../../lib/project-context';
import { getRequestContext } from '../../../lib/request-context';
import { getProjectService } from '../../../lib/project-service';

import {
  isProjectPriority,
  isProjectStatus,
  mapUpdateProjectActionError,
  readUpdateProjectFormValues,
  validateUpdateProjectFormValues,
  type UpdateProjectActionState,
} from './update-project-form';

export async function updateProjectAction(
  projectId: ProjectId,
  _previousState: UpdateProjectActionState,
  formData: FormData,
): Promise<UpdateProjectActionState> {
  const values = readUpdateProjectFormValues(formData);
  const validation = validateUpdateProjectFormValues(values);

  if (validation !== undefined) return validation;

  try {
    const context = await getRequestContext();
    await getProjectService().updateProject(toUpdateProjectContext(context), {
      projectId,
      name: values.name,
      ...(isProjectStatus(values.status) ? { status: values.status } : {}),
      ...(isProjectPriority(values.priority) ? { priority: values.priority } : {}),
      ...(values.percentComplete !== '' ? { percentComplete: Number(values.percentComplete) } : {}),
      ...(values.description.length > 0 ? { description: values.description } : { description: null }),
      programId: values.programId.length > 0 ? toProgramId(values.programId) : null,
    });

    revalidatePath(routes.projects);
    revalidatePath(projectRoute(projectId));
  } catch (error) {
    const mapped = mapUpdateProjectActionError(error, values);
    if (mapped !== undefined) return mapped;

    return { status: 'error', message: 'The project could not be updated. Please try again.', values };
  }

  return { status: 'success' };
}
