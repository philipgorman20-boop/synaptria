import type {
  MilestoneId,
  OrganizationId,
  TaskId,
} from '@synaptria/core';

import type { Priority } from '../shared/priority';

export type TaskStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Task {
  readonly id: TaskId;
  readonly organizationId: OrganizationId;
  readonly milestoneId: MilestoneId;
  readonly name: string;
  readonly description?: string;
  readonly status: TaskStatus;
  readonly priority: Priority;
  readonly plannedStartDate?: Date;
  readonly plannedEndDate?: Date;
  readonly actualStartDate?: Date;
  readonly actualEndDate?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
