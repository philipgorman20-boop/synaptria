import type { Milestone } from '@synaptria/domain/milestones';
import type { ContextPayload } from '@synaptria/domain/context';

export function mapMilestoneToContextPayload(milestone: Milestone): ContextPayload {
  return {
    id: milestone.id,
    organizationId: milestone.organizationId,
    projectId: milestone.projectId,
    name: milestone.name,
    description: milestone.description ?? null,
    status: milestone.status,
    priority: milestone.priority,
    plannedStartDate: milestone.plannedStartDate?.toISOString() ?? null,
    plannedEndDate: milestone.plannedEndDate?.toISOString() ?? null,
    actualStartDate: milestone.actualStartDate?.toISOString() ?? null,
    actualEndDate: milestone.actualEndDate?.toISOString() ?? null,
    createdAt: milestone.createdAt.toISOString(),
    updatedAt: milestone.updatedAt.toISOString(),
  };
}
