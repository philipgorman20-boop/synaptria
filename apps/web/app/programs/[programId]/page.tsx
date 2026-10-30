import { ApplicationError } from '@synaptria/application';
import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { notFound, redirect } from 'next/navigation';

import { toListDocumentsForProgramContext } from '../../../lib/document-context';
import { getDocumentService } from '../../../lib/document-service';
import { toGetProgramContext } from '../../../lib/program-context';
import { getProgramService } from '../../../lib/program-service';
import { toListProgramProjectsContext } from '../../../lib/project-context';
import { getProjectService } from '../../../lib/project-service';
import { getRequestContext } from '../../../lib/request-context';

import { DocumentsSection } from '../../documents/components/documents-section';
import { DeleteProgramDialog } from '../components/delete-program-dialog';
import { EditProgramDialog } from '../components/edit-program-dialog';
import { ProgramDetailHeader } from '../components/program-detail-header';
import { ProgramDetailMetadata } from '../components/program-detail-metadata';
import { ProgramProjectsSection } from '../components/program-projects-section';
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

  const [documentsResult, programProjectsResult] = await Promise.all([
    getDocumentService().listDocumentsForProgram(
      toListDocumentsForProgramContext(context),
      { programId },
    ),
    getProjectService().listProgramProjects(
      toListProgramProjectsContext(context),
      { programId },
    ),
  ]);

  const documents = documentsResult.documents;
  const programProjects = programProjectsResult.projects.filter((p) => p.deletedAt === undefined);

  return (
    <main className="dashboard programs-page program-detail-page">
      <ProgramDetailHeader program={program} />
      <ProgramDetailMetadata program={program} />
      <ProgramProjectsSection projects={programProjects} />
      <DocumentsSection
        documents={documents}
        programs={[]}
        projects={programProjects}
        lockedProgramId={programId}
      />
      <EditProgramDialog program={program} />
      <DeleteProgramDialog program={program} />
    </main>
  );
}
