import { ApplicationError } from '@synaptria/application';
import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { PERMISSIONS, hasPermission } from '@synaptria/permissions';
import { notFound, redirect } from 'next/navigation';

import { listProjectMilestonesAction } from '../../../actions/milestones/list-project-milestones';
import { toGetProjectContext } from '../../../../lib/project-context';
import { getProjectService } from '../../../../lib/project-service';
import { getRequestContext } from '../../../../lib/request-context';
import { parseProjectRouteParamForMilestones } from '../../../../lib/milestones-format';

import { MilestonesEmptyState } from './components/milestones-empty-state';
import { MilestonesList } from './components/milestones-list';
import { MilestonesPageHeader } from './components/milestones-page-header';

export interface ProjectMilestonesPageProps {
  readonly params: Promise<{
    readonly projectId: string;
  }>;
}

export default async function ProjectMilestonesPage({
  params,
}: ProjectMilestonesPageProps) {
  const { projectId: rawProjectId } = await params;
  const projectId = parseProjectRouteParamForMilestones(rawProjectId);

  if (projectId === null) {
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

  let milestones;

  try {
    ({ milestones } = await listProjectMilestonesAction(rawProjectId));
  } catch (error) {
    if (error instanceof ApplicationError && error.code === 'NOT_FOUND') {
      notFound();
    }

    throw error;
  }

  const canManageMilestones = hasPermission(
    context.role,
    PERMISSIONS.MILESTONES_MANAGE,
  );

  return (
    <main className="dashboard programs-page">
      <MilestonesPageHeader
        project={project}
        milestoneCount={milestones.length}
        canManageMilestones={canManageMilestones}
      />

      {milestones.length === 0 ? (
        <MilestonesEmptyState
          projectId={projectId}
          canManageMilestones={canManageMilestones}
        />
      ) : (
        <MilestonesList projectId={projectId} milestones={milestones} />
      )}
    </main>
  );
}
