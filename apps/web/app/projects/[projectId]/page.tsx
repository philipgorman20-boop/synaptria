import { ApplicationError } from '@synaptria/application';
import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import type { Program } from '@synaptria/domain/programs';
import type { ProgramId } from '@synaptria/core';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import { notFound, redirect } from 'next/navigation';

import { toListDocumentsForProjectContext } from '../../../lib/document-context';
import { getDocumentService } from '../../../lib/document-service';
import { toListProgramsContext } from '../../../lib/program-context';
import { toGetProgramContext } from '../../../lib/program-context';
import { getProgramService } from '../../../lib/program-service';
import { toGetProjectContext } from '../../../lib/project-context';
import { getProjectService } from '../../../lib/project-service';
import { getRequestContext } from '../../../lib/request-context';

import { DocumentsSection } from '../../documents/components/documents-section';
import { DeleteProjectDialog } from '../components/delete-project-dialog';
import { EditProjectDialog } from '../components/edit-project-dialog';
import { ProjectDetailHeader } from '../components/project-detail-header';
import { ProjectDetailMetadata } from '../components/project-detail-metadata';
import {
  parseProjectRouteParam,
  resolveProjectProgramDisplay,
} from '../projects-format';

export interface ProjectDetailPageProps {
  readonly params: Promise<{
    readonly projectId: string;
  }>;
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { projectId: rawProjectId } = await params;
  const projectId = parseProjectRouteParam(rawProjectId);

  if (projectId === null) {
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

  const [parentProgram, documentsResult, programsResult] = await Promise.all([
    loadAccessibleParentProgram(context, project.programId),
    getDocumentService().listDocumentsForProject(
      toListDocumentsForProjectContext(context),
      { projectId },
    ),
    getProgramService().listPrograms(toListProgramsContext(context)),
  ]);

  const programDisplay = resolveProjectProgramDisplay(
    project.programId,
    parentProgram,
  );

  const documents = documentsResult.documents;
  const programs = programsResult.programs.filter((p) => p.deletedAt === undefined);

  return (
    <main className="dashboard programs-page program-detail-page">
      <ProjectDetailHeader project={project} />
      <ProjectDetailMetadata project={project} programDisplay={programDisplay} />
      <DocumentsSection
        documents={documents}
        programs={programs}
        projects={[]}
        lockedProjectId={projectId}
      />
      <EditProjectDialog project={project} programs={programs} />
      <DeleteProjectDialog project={project} />
    </main>
  );
}

async function loadAccessibleParentProgram(
  context: ResolvedOrganizationContext,
  linkedProgramId: ProgramId | undefined,
): Promise<Program | null> {
  if (linkedProgramId === undefined) {
    return null;
  }

  try {
    const { program } = await getProgramService().getProgram(
      toGetProgramContext(context),
      { programId: linkedProgramId },
    );

    return program;
  } catch (error) {
    if (
      error instanceof ApplicationError &&
      error.code === 'NOT_FOUND'
    ) {
      return null;
    }

    if (error instanceof AuthorizationDeniedError) {
      return null;
    }

    throw error;
  }
}
