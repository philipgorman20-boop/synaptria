import type {
  MilestoneId,
  OrganizationId,
  ProjectId,
} from '@synaptria/core';

export type MilestoneStatus =
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'CANCELLED';

export type MilestonePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Milestone {
  readonly id: MilestoneId;
  readonly organizationId: OrganizationId;
  readonly projectId: ProjectId;
  readonly name: string;
  readonly description?: string;
  readonly status: MilestoneStatus;
  readonly priority: MilestonePriority;
  readonly plannedStartDate?: Date;
  readonly plannedEndDate?: Date;
  readonly actualStartDate?: Date;
  readonly actualEndDate?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
