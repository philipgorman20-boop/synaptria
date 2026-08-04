import { ApplicationError } from '@synaptria/application';
import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { PERMISSIONS, hasPermission } from '@synaptria/permissions';
import { notFound, redirect } from 'next/navigation';

import { getMilestoneAction } from '../../../../../../actions/milestones/get-milestone';
import { toGetProjectContext } from '../../../../../../../lib/project-context';
import { getProjectService } from '../../../../../../../lib/project-service';
import { getRequestContext } from '../../../../../../../lib/request-context';
import {
  getMilestoneTasksListHref,
  parseMilestoneRouteParamForTasks,
  parseProjectRouteParamForTasks,
} from '../../../../../../../lib/tasks-format';

import { CreateTaskForm } from './components/create-task-form';
import { CreateTaskPageHeader } from './components/create-task-page-header';

export interface CreateTaskPageProps {
  readonly params: Promise<{
    readonly projectId: string;
    readonly milestoneId: string;
  }>;
}

export default async function CreateTaskPage({ params }: CreateTaskPageProps) {
  const { projectId: rawProjectId, milestoneId: rawMilestoneId } = await params;
  const projectId = parseProjectRouteParamForTasks(rawProjectId);
  const milestoneId = parseMilestoneRouteParamForTasks(rawMilestoneId);

  if (projectId === null || milestoneId === null) {
    notFound();
  }

  let context: ResolvedOrganizationContext;

  try {
    context = await getRequestContext();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect('/sign-in');
    }

    if (error instanceof OrganizationMembershipRequiredError) {
      redirect('/no-organization');
    }

    throw error;
  }

  if (!hasPermission(context.role, PERMISSIONS.TASKS_MANAGE)) {
    redirect(getMilestoneTasksListHref(projectId, milestoneId));
  }

  let project;

  try {
    ({ project } = await getProjectService().getProject(
      toGetProjectContext(context),
      { projectId },
    ));
  } catch (error) {
    if (error instanceof ApplicationError && error.code === 'NOT_FOUND') {
      notFound();
    }

    throw error;
  }

  let milestone;

  try {
    ({ milestone } = await getMilestoneAction(rawMilestoneId));
  } catch (error) {
    if (error instanceof ApplicationError && error.code === 'NOT_FOUND') {
      notFound();
    }

    throw error;
  }

  if (milestone.projectId !== projectId || milestone.id !== milestoneId) {
    notFound();
  }

  return (
    <main className="dashboard programs-page program-detail-page">
      <CreateTaskPageHeader project={project} milestone={milestone} />
      <section
        aria-labelledby="create-task-form-heading"
        className="program-detail-metadata"
      >
        <h2 id="create-task-form-heading">Task details</h2>
        <CreateTaskForm milestoneId={milestoneId} />
      </section>
    </main>
  );
}
