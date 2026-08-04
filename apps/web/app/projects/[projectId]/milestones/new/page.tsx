import { ApplicationError } from '@synaptria/application';
import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { PERMISSIONS, hasPermission } from '@synaptria/permissions';
import { notFound, redirect } from 'next/navigation';

import { toGetProjectContext } from '../../../../../lib/project-context';
import { getProjectService } from '../../../../../lib/project-service';
import { getRequestContext } from '../../../../../lib/request-context';
import {
  getProjectMilestonesListHref,
  parseProjectRouteParamForMilestones,
} from '../../../../../lib/milestones-format';

import { CreateMilestoneForm } from './components/create-milestone-form';
import { CreateMilestonePageHeader } from './components/create-milestone-page-header';

export interface CreateMilestonePageProps {
  readonly params: Promise<{
    readonly projectId: string;
  }>;
}

export default async function CreateMilestonePage({
  params,
}: CreateMilestonePageProps) {
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

  if (!hasPermission(context.role, PERMISSIONS.MILESTONES_MANAGE)) {
    redirect(getProjectMilestonesListHref(projectId));
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

  return (
    <main className="dashboard programs-page program-detail-page">
      <CreateMilestonePageHeader project={project} />
      <section
        aria-labelledby="create-milestone-form-heading"
        className="program-detail-metadata"
      >
        <h2 id="create-milestone-form-heading">Milestone details</h2>
        <CreateMilestoneForm projectId={projectId} />
      </section>
    </main>
  );
}
