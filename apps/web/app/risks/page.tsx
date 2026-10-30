import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { routes } from '@synaptria/config';
import type { Risk } from '@synaptria/domain/risks';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getRiskDetailHref } from './risks-format';
import { toListRisksContext } from '../../lib/risk-context';
import { getRiskService } from '../../lib/risk-service';
import { getRequestContext } from '../../lib/request-context';
import { toListProgramsContext } from '../../lib/program-context';
import { getProgramService } from '../../lib/program-service';
import { toListProjectsContext } from '../../lib/project-context';
import { getProjectService } from '../../lib/project-service';

import { CreateRiskDialog } from './components/create-risk-dialog';

export default async function RisksPage() {
  let context: ResolvedOrganizationContext;

  try {
    context = await getRequestContext();
  } catch (error) {
    if (error instanceof AuthenticationError) redirect('/sign-in');
    if (error instanceof OrganizationMembershipRequiredError) redirect('/no-organization');
    throw error;
  }

  const [riskResult, programResult, projectResult] = await Promise.all([
    getRiskService().listRisks(toListRisksContext(context)),
    getProgramService().listPrograms(toListProgramsContext(context)),
    getProjectService().listProjects(toListProjectsContext(context)),
  ]);
  const risks = riskResult.risks.filter(isVisibleRisk);
  const programs = programResult.programs.filter((p) => p.deletedAt === undefined);
  const projects = projectResult.projects.filter((p) => p.deletedAt === undefined);

  return (
    <main className="dashboard">
      <div className="page-header">
        <div>
          <h1>Risks</h1>
          <p className="page-subtitle">
            {risks.length} {risks.length === 1 ? 'risk' : 'risks'} across {context.organizationName}
          </p>
        </div>
        <div className="page-header-actions">
          <CreateRiskDialog programs={programs} projects={projects} />
          <Link className="secondary-button" href={routes.dashboard}>Dashboard</Link>
        </div>
      </div>

      {risks.length === 0 ? (
        <div className="empty-state">
          <h2>No risks logged</h2>
          <p>Add risks to track potential threats to your programs and projects.</p>
        </div>
      ) : (
        <section aria-label="Risks">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Probability</th>
                <th>Impact</th>
              </tr>
            </thead>
            <tbody>
              {risks.map((risk) => (
                <tr key={risk.id}>
                  <td><Link href={getRiskDetailHref(risk.id)}>{risk.title}</Link></td>
                  <td>{risk.category}</td>
                  <td>{risk.status}</td>
                  <td>{risk.probability}</td>
                  <td>{risk.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

function isVisibleRisk(risk: Risk): boolean {
  return risk.deletedAt === undefined;
}
