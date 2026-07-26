import { ApplicationError } from '@synaptria/application';
import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { notFound, redirect } from 'next/navigation';

import { getMilestoneAction } from '../../../../actions/milestones/get-milestone';
import { toGetProjectContext } from '../../../../../lib/project-context';
import { getProjectService } from '../../../../../lib/project-service';
import { getRequestContext } from '../../../../../lib/request-context';
import {
  parseMilestoneRouteParam,
  parseProjectRouteParamForMilestones,
} from '../../../../../lib/milestones-format';

import { MilestoneDetailHeader } from './components/milestone-detail-header';
import { MilestoneDetailMetadata } from './components/milestone-detail-metadata';

export interface MilestoneDetailPageProps {
  readonly params: Promise<{
    readonly projectId: string;
    readonly milestoneId: string;
  }>;
}

export default async function MilestoneDetailPage({
  params,
}: MilestoneDetailPageProps) {
  const { projectId: rawProjectId, milestoneId: rawMilestoneId } = await params;
  const projectId = parseProjectRouteParamForMilestones(rawProjectId);
  const milestoneId = parseMilestoneRouteParam(rawMilestoneId);

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

  return (
    <main className="dashboard programs-page program-detail-page">
      <MilestoneDetailHeader project={project} milestone={milestone} />
      <MilestoneDetailMetadata milestone={milestone} />
    </main>
  );
}
