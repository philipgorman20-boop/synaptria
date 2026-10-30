import type { Project } from '@synaptria/domain/projects';
import Link from 'next/link';
import { projectRoute } from '@synaptria/config';

interface ProgramProjectsSectionProps {
  readonly projects: readonly Project[];
}

export function ProgramProjectsSection({ projects }: ProgramProjectsSectionProps) {
  return (
    <section aria-label="Projects" className="detail-section">
      <div className="detail-section-header">
        <h2>Projects <span className="count-badge">{projects.length}</span></h2>
      </div>

      {projects.length === 0 ? (
        <p className="empty-state-inline">No projects linked to this program.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id}>
                <td><Link href={projectRoute(project.id)}>{project.name}</Link></td>
                <td>{project.status}</td>
                <td>{project.priority}</td>
                <td>{project.percentComplete}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
