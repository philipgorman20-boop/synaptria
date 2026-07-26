import { ApplicationError } from '@synaptria/application';
import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { PERMISSIONS, hasPermission } from '@synaptria/permissions';
import { notFound, redirect } from 'next/navigation';

import { getMilestoneAction } from '../../../../../actions/milestones/get-milestone';
import { listMilestoneTasksAction } from '../../../../../actions/tasks/list-milestone-tasks';
import { toGetProjectContext } from '../../../../../../lib/project-context';
import { getProjectService } from '../../../../../../lib/project-service';
import { getRequestContext } from '../../../../../../lib/request-context';
import {
  parseMilestoneRouteParamForTasks,
  parseProjectRouteParamForTasks,
} from '../../../../../../lib/tasks-format';

import { TasksEmptyState } from './components/tasks-empty-state';
import { TasksList } from './components/tasks-list';
import { TasksPageHeader } from './components/tasks-page-header';

export interface MilestoneTasksPageProps {
  readonly params: Promise<{
    readonly projectId: string;
    readonly milestoneId: string;
  }>;
}

export default async function MilestoneTasksPage({
  params,
}: MilestoneTasksPageProps) {
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

  if (milestone.projectId !== projectId) {
    notFound();
  }

  if (milestone.id !== milestoneId) {
    notFound();
  }

  let tasks;

  try {
    ({ tasks } = await listMilestoneTasksAction(rawMilestoneId));
  } catch (error) {
    if (error instanceof ApplicationError && error.code === 'NOT_FOUND') {
      notFound();
    }

    throw error;
  }

  const canManageTasks = hasPermission(context.role, PERMISSIONS.TASKS_MANAGE);

  return (
    <main className="dashboard programs-page">
      <TasksPageHeader
        project={project}
        milestone={milestone}
        taskCount={tasks.length}
        canManageTasks={canManageTasks}
      />

      {tasks.length === 0 ? (
        <TasksEmptyState
          projectId={projectId}
          milestoneId={milestoneId}
          canManageTasks={canManageTasks}
        />
      ) : (
        <TasksList
          projectId={projectId}
          milestoneId={milestoneId}
          tasks={tasks}
        />
      )}
    </main>
  );
}
