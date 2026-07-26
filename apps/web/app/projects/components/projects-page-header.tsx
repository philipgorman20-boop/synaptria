import { routes } from '@synaptria/config';
import Link from 'next/link';

import type { ProjectProgramOption } from '../projects-format';

import { CreateProjectDialog } from './create-project-dialog';

export interface ProjectsPageHeaderProps {
  readonly organizationName: string;
  readonly role: string;
  readonly projectCount: number;
  readonly canManageProjects: boolean;
  readonly programOptions: readonly ProjectProgramOption[];
}

export function ProjectsPageHeader({
  organizationName,
  role,
  projectCount,
  canManageProjects,
  programOptions,
}: ProjectsPageHeaderProps) {
  return (
    <header className="programs-page-header">
      <div className="programs-page-heading">
        <p className="eyebrow">EXECUTION</p>
        <h1>Projects</h1>
        <p>
          Operational work for {organizationName}. You are viewing this portfolio
          as {role.toLowerCase()}.
        </p>
        <p className="programs-page-count" aria-live="polite">
          {projectCount === 1 ? '1 project' : `${projectCount} projects`}
        </p>
      </div>

      <div className="programs-page-actions">
        {canManageProjects ? (
          <CreateProjectDialog programOptions={programOptions} />
        ) : null}
        <Link className="secondary-button programs-page-back-link" href={routes.dashboard}>
          Back to dashboard
        </Link>
      </div>
    </header>
  );
}
