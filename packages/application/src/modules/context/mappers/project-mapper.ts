import type { Project } from '@synaptria/domain/projects';
import type { ContextPayload } from '@synaptria/domain/context';

export function mapProjectToContextPayload(project: Project): ContextPayload {
  return {
    id: project.id,
    organizationId: project.organizationId,
    programId: project.programId ?? null,
    ownerId: project.ownerId ?? null,
    name: project.name,
    code: project.code ?? null,
    description: project.description ?? null,
    status: project.status,
    priority: project.priority,
    percentComplete: project.percentComplete,
    startDate: project.startDate?.toISOString() ?? null,
    targetEndDate: project.targetEndDate?.toISOString() ?? null,
    completedAt: project.completedAt?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}
