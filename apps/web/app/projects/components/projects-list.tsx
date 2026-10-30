import type { Project } from '@synaptria/domain/projects';

import { ProjectCard } from './project-card';

export interface ProjectsListProps {
  readonly projects: readonly Project[];
}

export function ProjectsList({ projects }: ProjectsListProps) {
  return (
    <section className="programs-list" aria-label="Projects">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </section>
  );
}
