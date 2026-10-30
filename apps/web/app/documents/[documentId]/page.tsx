import { ApplicationError } from '@synaptria/application';
import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { notFound, redirect } from 'next/navigation';

import { toGetDocumentContext } from '../../../lib/document-context';
import { getDocumentService } from '../../../lib/document-service';
import { getRequestContext } from '../../../lib/request-context';
import { parseDocumentRouteParam } from '../documents-format';
import { toListProgramsContext } from '../../../lib/program-context';
import { getProgramService } from '../../../lib/program-service';
import { toListProjectsContext } from '../../../lib/project-context';
import { getProjectService } from '../../../lib/project-service';

import { DeleteDocumentDialog } from '../components/delete-document-dialog';
import { EditDocumentDialog } from '../components/edit-document-dialog';
import { DocumentDetailHeader } from '../components/document-detail-header';
import { DocumentDetailMetadata } from '../components/document-detail-metadata';

export interface DocumentDetailPageProps {
  readonly params: Promise<{ readonly documentId: string }>;
}

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const { documentId: rawDocumentId } = await params;
  const documentId = parseDocumentRouteParam(rawDocumentId);

  if (documentId === null) notFound();

  let context: ResolvedOrganizationContext;

  try {
    context = await getRequestContext();
  } catch (error) {
    if (error instanceof AuthenticationError) redirect('/sign-in');
    if (error instanceof OrganizationMembershipRequiredError) redirect('/no-organization');
    throw error;
  }

  let document;

  try {
    ({ document } = await getDocumentService().getDocument(toGetDocumentContext(context), { documentId }));
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
      <DocumentDetailHeader document={document} actions={<><EditDocumentDialog document={document} programs={programs} projects={projects} /><DeleteDocumentDialog document={document} /></>} />
      <DocumentDetailMetadata document={document} programs={programs} projects={projects} />
    </main>
  );
}
