import { ApplicationError } from '@synaptria/application';
import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { notFound, redirect } from 'next/navigation';

import { toGetDecisionContext } from '../../../lib/decision-context';
import { getDecisionService } from '../../../lib/decision-service';
import { getRequestContext } from '../../../lib/request-context';
import { parseDecisionRouteParam } from '../decisions-format';
import { toListProgramsContext } from '../../../lib/program-context';
import { getProgramService } from '../../../lib/program-service';
import { toListProjectsContext } from '../../../lib/project-context';
import { getProjectService } from '../../../lib/project-service';

import { DeleteDecisionDialog } from '../components/delete-decision-dialog';
import { EditDecisionDialog } from '../components/edit-decision-dialog';
import { DecisionDetailHeader } from '../components/decision-detail-header';
import { DecisionDetailMetadata } from '../components/decision-detail-metadata';

export interface DecisionDetailPageProps {
  readonly params: Promise<{ readonly decisionId: string }>;
}

export default async function DecisionDetailPage({ params }: DecisionDetailPageProps) {
  const { decisionId: rawDecisionId } = await params;
  const decisionId = parseDecisionRouteParam(rawDecisionId);

  if (decisionId === null) notFound();

  let context: ResolvedOrganizationContext;

  try {
    context = await getRequestContext();
  } catch (error) {
    if (error instanceof AuthenticationError) redirect('/sign-in');
    if (error instanceof OrganizationMembershipRequiredError) redirect('/no-organization');
    throw error;
  }

  let decision;

  try {
    ({ decision } = await getDecisionService().getDecision(toGetDecisionContext(context), { decisionId }));
  } catch (error) {
    if (error instanceof ApplicationError && error.code === 'NOT_FOUND') notFound();
    throw error;
  }

  const [programResult, projectResult] = await Promise.all([
    getProgramService().listPrograms(toListProgramsContext(context)),
    getProjectService().listProjects(toListProjectsContext(context)),
  ]);
  const programs = programResult.programs.filter((p) => p.deletedAt === undefined);
  const projects = projectResult.projects.filter((p) => p.deletedAt === undefined);

  return (
    <main className="dashboard">
      <DecisionDetailHeader decision={decision} actions={<><EditDecisionDialog decision={decision} programs={programs} projects={projects} /><DeleteDecisionDialog decision={decision} /></>} />
      <DecisionDetailMetadata decision={decision} programs={programs} projects={projects} />
    </main>
  );
}
