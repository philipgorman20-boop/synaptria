import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import type { Program } from '@synaptria/domain/programs';
import { redirect } from 'next/navigation';

import { toListProgramsContext } from '../../lib/program-context';
import { getProgramService } from '../../lib/program-service';
import { getRequestContext } from '../../lib/request-context';

import { ProgramsEmptyState } from './components/programs-empty-state';
import { ProgramsList } from './components/programs-list';
import { ProgramsPageHeader } from './components/programs-page-header';

export default async function ProgramsPage() {
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

  const programList = await getProgramService().listPrograms(
    toListProgramsContext(context),
  );
  const programs = programList.programs.filter(isVisibleProgram);

  return (
    <main className="dashboard programs-page">
      <ProgramsPageHeader
        organizationName={context.organizationName}
        role={context.role}
        programCount={programs.length}
      />

      {programs.length === 0 ? (
        <ProgramsEmptyState />
      ) : (
        <ProgramsList programs={programs} />
      )}
    </main>
  );
}

function isVisibleProgram(program: Program): boolean {
  return program.deletedAt === undefined;
}
