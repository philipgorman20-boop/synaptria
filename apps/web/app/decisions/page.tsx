import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { routes } from '@synaptria/config';
import type { Decision } from '@synaptria/domain/decisions';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { toListDecisionsContext } from '../../lib/decision-context';
import { getDecisionService } from '../../lib/decision-service';
import { getRequestContext } from '../../lib/request-context';
import { toListProgramsContext } from '../../lib/program-context';
import { getProgramService } from '../../lib/program-service';
import { toListProjectsContext } from '../../lib/project-context';
import { getProjectService } from '../../lib/project-service';

import { CreateDecisionDialog } from './components/create-decision-dialog';
import { DecisionsTable } from './components/decisions-table';

export default async function DecisionsPage() {
  let context: ResolvedOrganizationContext;

  try {
    context = await getRequestContext();
  } catch (error) {
    if (error instanceof AuthenticationError) redirect('/sign-in');
    if (error instanceof OrganizationMembershipRequiredError) redirect('/no-organization');
    throw error;
  }

  const [decisionResult, programResult, projectResult] = await Promise.all([
    getDecisionService().listDecisions(toListDecisionsContext(context)),
    getProgramService().listPrograms(toListProgramsContext(context)),
    getProjectService().listProjects(toListProjectsContext(context)),
  ]);
  const decisions = decisionResult.decisions.filter(isVisibleDecision);
  const programs = programResult.programs.filter((p) => p.deletedAt === undefined);
  const projects = projectResult.projects.filter((p) => p.deletedAt === undefined);

  return (
    <main className="dashboard">
      <div className="page-header">
        <div>
          <h1>Decisions</h1>
          <p className="page-subtitle">
            {decisions.length} {decisions.length === 1 ? 'decision' : 'decisions'} logged for {context.organizationName}
          </p>
        </div>
        <div className="page-header-actions">
          <CreateDecisionDialog programs={programs} projects={projects} />
          <Link className="secondary-button" href={routes.dashboard}>Dashboard</Link>
        </div>
      </div>

      {decisions.length === 0 ? (
        <div className="empty-state">
          <h2>No decisions logged</h2>
          <p>Record key decisions to maintain an audit trail across your programs and projects.</p>
        </div>
      ) : (
        <section aria-label="Decisions">
          <DecisionsTable decisions={decisions} />
        </section>
      )}
    </main>
  );
}

function isVisibleDecision(decision: Decision): boolean {
  return decision.deletedAt === undefined;
}
