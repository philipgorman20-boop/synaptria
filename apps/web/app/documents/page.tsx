import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { routes } from '@synaptria/config';
import type { Document } from '@synaptria/domain/documents';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { toListDocumentsContext } from '../../lib/document-context';
import { getDocumentService } from '../../lib/document-service';
import { getRequestContext } from '../../lib/request-context';
import { toListProgramsContext } from '../../lib/program-context';
import { getProgramService } from '../../lib/program-service';
import { toListProjectsContext } from '../../lib/project-context';
import { getProjectService } from '../../lib/project-service';

import { getDocumentDetailHref } from './documents-format';

import { CreateDocumentDialog } from './components/create-document-dialog';

export default async function DocumentsPage() {
  let context: ResolvedOrganizationContext;

  try {
    context = await getRequestContext();
  } catch (error) {
    if (error instanceof AuthenticationError) redirect('/sign-in');
    if (error instanceof OrganizationMembershipRequiredError) redirect('/no-organization');
    throw error;
  }

  const [documentResult, programResult, projectResult] = await Promise.all([
    getDocumentService().listDocuments(toListDocumentsContext(context)),
    getProgramService().listPrograms(toListProgramsContext(context)),
    getProjectService().listProjects(toListProjectsContext(context)),
  ]);
  const documents = documentResult.documents.filter(isVisibleDocument);
  const programs = programResult.programs.filter((p) => p.deletedAt === undefined);
  const projects = projectResult.projects.filter((p) => p.deletedAt === undefined);

  return (
    <main className="dashboard">
      <div className="page-header">
        <div>
          <h1>Documents</h1>
          <p className="page-subtitle">
            {documents.length} {documents.length === 1 ? 'document' : 'documents'} in {context.organizationName}
          </p>
        </div>
        <div className="page-header-actions">
          <CreateDocumentDialog programs={programs} projects={projects} />
          <Link className="secondary-button" href={routes.dashboard}>Dashboard</Link>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="empty-state">
          <h2>No documents yet</h2>
          <p>Register contracts, protocols, reports, and other key documents for your organization.</p>
        </div>
      ) : (
        <section aria-label="Documents">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Version</th>
                <th>Program</th>
                <th>Project</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => {
                const program = doc.programId !== undefined ? programs.find((p) => p.id === doc.programId) : undefined;
                const project = doc.projectId !== undefined ? projects.find((p) => p.id === doc.projectId) : undefined;
                return (
                  <tr key={doc.id}>
                    <td><Link href={getDocumentDetailHref(doc.id)}>{doc.title}</Link></td>
                    <td>{doc.type}</td>
                    <td>{doc.status}</td>
                    <td>{doc.currentVersion}</td>
                    <td>{program?.name ?? '—'}</td>
                    <td>{project?.name ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}

function isVisibleDocument(document: Document): boolean {
  return document.deletedAt === undefined;
}
