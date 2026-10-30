import { ApplicationError } from '@synaptria/application';
import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { notFound, redirect } from 'next/navigation';

import { toGetRiskContext } from '../../../lib/risk-context';
import { getRiskService } from '../../../lib/risk-service';
import { getRequestContext } from '../../../lib/request-context';
import { parseRiskRouteParam } from '../risks-format';
import { toListProgramsContext } from '../../../lib/program-context';
import { getProgramService } from '../../../lib/program-service';
import { toListProjectsContext } from '../../../lib/project-context';
import { getProjectService } from '../../../lib/project-service';

import { DeleteRiskDialog } from '../components/delete-risk-dialog';
import { EditRiskDialog } from '../components/edit-risk-dialog';
import { RiskDetailHeader } from '../components/risk-detail-header';
import { RiskDetailMetadata } from '../components/risk-detail-metadata';

export interface RiskDetailPageProps {
  readonly params: Promise<{ readonly riskId: string }>;
}

export default async function RiskDetailPage({ params }: RiskDetailPageProps) {
  const { riskId: rawRiskId } = await params;
  const riskId = parseRiskRouteParam(rawRiskId);

  if (riskId === null) notFound();

  let context: ResolvedOrganizationContext;

  try {
    context = await getRequestContext();
  } catch (error) {
    if (error instanceof AuthenticationError) redirect('/sign-in');
    if (error instanceof OrganizationMembershipRequiredError) redirect('/no-organization');
    throw error;
  }

  let risk;

  try {
    ({ risk } = await getRiskService().getRisk(toGetRiskContext(context), { riskId }));
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
      <RiskDetailHeader risk={risk} actions={<><EditRiskDialog risk={risk} programs={programs} projects={projects} /><DeleteRiskDialog risk={risk} /></>} />
      <RiskDetailMetadata risk={risk} programs={programs} projects={projects} />
    </main>
  );
}
