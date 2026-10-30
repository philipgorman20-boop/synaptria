'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { routes } from '@synaptria/config';
import type { ProjectId } from '@synaptria/core';

import { toDeleteProjectContext } from '../../../lib/project-context';
import { getRequestContext } from '../../../lib/request-context';
import { getProjectService } from '../../../lib/project-service';
import type { DeleteProjectActionState } from './delete-project-form';

export async function deleteProjectAction(
  projectId: ProjectId,
  _previousState: DeleteProjectActionState,
): Promise<DeleteProjectActionState> {
  try {
    const context = await getRequestContext();
    await getProjectService().deleteProject(toDeleteProjectContext(context), { projectId });
    revalidatePath(routes.projects);
  } catch {
    return { status: 'error', message: 'The project could not be deleted. Please try again.' };
  }

  redirect(routes.projects);
}
