import type { ProjectProgramOption } from '../projects-format';

import { CreateProjectDialog } from './create-project-dialog';

export interface ProjectsEmptyStateProps {
  readonly canManageProjects: boolean;
  readonly programOptions: readonly ProjectProgramOption[];
}

export function ProjectsEmptyState({
  canManageProjects,
  programOptions,
}: ProjectsEmptyStateProps) {
  return (
    <section
      className="programs-empty-state"
      aria-labelledby="projects-empty-heading"
    >
      <p className="eyebrow">EXECUTION</p>
      <h2 id="projects-empty-heading">No projects yet</h2>
      <p>
        Projects track scientific and operational execution work for your
        organization. When projects are created, they will appear here.
      </p>
      {canManageProjects ? (
        <div className="programs-empty-state-actions">
          <CreateProjectDialog
            programOptions={programOptions}
            triggerLabel="Create your first project"
          />
        </div>
      ) : null}
    </section>
  );
}
