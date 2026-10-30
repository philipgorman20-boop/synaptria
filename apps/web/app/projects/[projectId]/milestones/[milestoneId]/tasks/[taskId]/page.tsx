import { ApplicationError } from '@synaptria/application';
import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { notFound, redirect } from 'next/navigation';

import { getMilestoneAction } from '../../../../../../actions/milestones/get-milestone';
import { getTaskAction } from '../../../../../../actions/tasks/get-task';
import { toGetProjectContext } from '../../../../../../../lib/project-context';
import { getProjectService } from '../../../../../../../lib/project-service';
import { getRequestContext } from '../../../../../../../lib/request-context';
import {
  parseMilestoneRouteParamForTasks,
  parseProjectRouteParamForTasks,
  parseTaskRouteParam,
} from '../../../../../../../lib/tasks-format';

import { TaskDetailHeader } from './components/task-detail-header';
import { TaskDetailMetadata } from './components/task-detail-metadata';

export interface TaskDetailPageProps {
  readonly params: Promise<{
    readonly projectId: string;
    readonly milestoneId: string;
    readonly taskId: string;
  }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const {
    projectId: rawProjectId,
    milestoneId: rawMilestoneId,
    taskId: rawTaskId,
  } = await params;
  const projectId = parseProjectRouteParamForTasks(rawProjectId);
  const milestoneId = parseMilestoneRouteParamForTasks(rawMilestoneId);
  const taskId = parseTaskRouteParam(rawTaskId);

  if (projectId === null || milestoneId === null || taskId === null) {
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

  if (milestone.projectId !== projectId || milestone.id !== milestoneId) {
    notFound();
  }

  let task;

  try {
    ({ task } = await getTaskAction(rawTaskId));
  } catch (error) {
    if (error instanceof ApplicationError && error.code === 'NOT_FOUND') {
      notFound();
    }

    throw error;
  }

  if (task.milestoneId !== milestoneId) {
    notFound();
  }

  return (
    <main className="dashboard programs-page program-detail-page">
      <TaskDetailHeader project={project} milestone={milestone} task={task} />
      <TaskDetailMetadata task={task} />
    </main>
  );
}
