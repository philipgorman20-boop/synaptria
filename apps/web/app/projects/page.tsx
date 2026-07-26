import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import type { Project } from '@synaptria/domain/projects';
import { PERMISSIONS, hasPermission } from '@synaptria/permissions';
import { redirect } from 'next/navigation';

import { toListProgramsContext } from '../../lib/program-context';
import { getProgramService } from '../../lib/program-service';
import { toListProjectsContext } from '../../lib/project-context';
import { getProjectService } from '../../lib/project-service';
import { getRequestContext } from '../../lib/request-context';

import { ProjectsEmptyState } from './components/projects-empty-state';
import { ProjectsList } from './components/projects-list';
import { ProjectsPageHeader } from './components/projects-page-header';
import { toProjectProgramOptions } from './projects-format';

export default async function ProjectsPage() {
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

  const canManageProjects = hasPermission(context.role, PERMISSIONS.PROJECTS_MANAGE);
  const projectList = await getProjectService().listProjects(
    toListProjectsContext(context),
  );
  const projects = projectList.projects.filter(isVisibleProject);

  const programOptions = canManageProjects
    ? toProjectProgramOptions(
        (
          await getProgramService().listPrograms(toListProgramsContext(context))
        ).programs,
      )
    : [];

  return (
    <main className="dashboard programs-page">
      <ProjectsPageHeader
        organizationName={context.organizationName}
        role={context.role}
        projectCount={projects.length}
        canManageProjects={canManageProjects}
        programOptions={programOptions}
      />

      {projects.length === 0 ? (
        <ProjectsEmptyState
          canManageProjects={canManageProjects}
          programOptions={programOptions}
        />
      ) : (
        <ProjectsList projects={projects} />
      )}
    </main>
  );
}

function isVisibleProject(project: Project): boolean {
  return project.deletedAt === undefined;
}
