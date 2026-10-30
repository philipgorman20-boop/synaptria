import type { Task } from '@synaptria/domain/tasks';
import type { ContextPayload } from '@synaptria/domain/context';

export function mapTaskToContextPayload(task: Task): ContextPayload {
  return {
    id: task.id,
    organizationId: task.organizationId,
    milestoneId: task.milestoneId,
    name: task.name,
    description: task.description ?? null,
    status: task.status,
    priority: task.priority,
    plannedStartDate: task.plannedStartDate?.toISOString() ?? null,
    plannedEndDate: task.plannedEndDate?.toISOString() ?? null,
    actualStartDate: task.actualStartDate?.toISOString() ?? null,
    actualEndDate: task.actualEndDate?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
