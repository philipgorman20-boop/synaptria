import { ApplicationError } from '@synaptria/application';
import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { notFound, redirect } from 'next/navigation';

import { toGetProgramContext } from '../../../lib/program-context';
import { getProgramService } from '../../../lib/program-service';
import { getRequestContext } from '../../../lib/request-context';

import { ProgramDetailHeader } from '../components/program-detail-header';
import { ProgramDetailMetadata } from '../components/program-detail-metadata';
import { parseProgramRouteParam } from '../programs-format';

export interface ProgramDetailPageProps {
  readonly params: Promise<{
    readonly programId: string;
  }>;
}

export default async function ProgramDetailPage({
  params,
}: ProgramDetailPageProps) {
  const { programId: rawProgramId } = await params;
  const programId = parseProgramRouteParam(rawProgramId);

  if (programId === null) {
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

  let program;

  try {
    ({ program } = await getProgramService().getProgram(
      toGetProgramContext(context),
      { programId },
    ));
  } catch (error) {
    if (error instanceof ApplicationError && error.code === 'NOT_FOUND') {
      notFound();
    }

    throw error;
  }

  return (
    <main className="dashboard programs-page program-detail-page">
      <ProgramDetailHeader program={program} />
      <ProgramDetailMetadata program={program} />
    </main>
  );
}
