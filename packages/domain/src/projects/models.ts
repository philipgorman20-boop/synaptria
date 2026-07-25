import type {
  OrganizationId,
  ProgramId,
  ProjectId,
  UserId,
} from '@synaptria/core';

export type ProjectStatus =
  | 'PLANNED'
  | 'ACTIVE'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CANCELLED';

export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Project {
  readonly id: ProjectId;
  readonly organizationId: OrganizationId;
  readonly programId?: ProgramId;
  readonly ownerId?: UserId;
  readonly name: string;
  readonly code?: string;
  readonly description?: string;
  readonly status: ProjectStatus;
  readonly priority: ProjectPriority;
  readonly percentComplete: number;
  readonly startDate?: Date;
  readonly targetEndDate?: Date;
  readonly completedAt?: Date;
  readonly deletedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
