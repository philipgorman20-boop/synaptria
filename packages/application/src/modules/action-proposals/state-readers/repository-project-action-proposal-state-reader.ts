import type { ProjectRepository } from '@synaptria/domain/projects';

import type {
  ProjectActionProposalState,
  ProjectActionProposalStateReader,
} from './types';

function toScalarDate(value: Date | undefined): string | null {
  return value === undefined ? null : value.toISOString();
}

export class RepositoryProjectActionProposalStateReader
  implements ProjectActionProposalStateReader
{
  constructor(private readonly projects: ProjectRepository) {}

  async findById(
    organizationId: Parameters<ProjectActionProposalStateReader['findById']>[0],
    id: Parameters<ProjectActionProposalStateReader['findById']>[1],
  ): Promise<ProjectActionProposalState | null> {
    const project = await this.projects.findById(organizationId, id);
    if (project === null) {
      return null;
    }

    return {
      projectId: project.id,
      organizationId: project.organizationId,
      status: project.status,
      priority: project.priority,
      targetEndDate: toScalarDate(project.targetEndDate),
      updatedAt: project.updatedAt.toISOString(),
    };
  }
}
