import type {
  OrganizationId,
  ProgramId,
  UserId,
} from '@synaptria/core';

export type ProgramStatus =
  | 'CONCEPT'
  | 'DISCOVERY'
  | 'PRECLINICAL'
  | 'IND_ENABLING'
  | 'CLINICAL'
  | 'PARTNERED'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'TERMINATED';

export type ProgramPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Program {
  readonly id: ProgramId;
  readonly organizationId: OrganizationId;
  readonly ownerId?: UserId;
  readonly name: string;
  readonly code?: string;
  readonly description?: string;
  readonly indication?: string;
  readonly modality?: string;
  readonly target?: string;
  readonly status: ProgramStatus;
  readonly priority: ProgramPriority;
  readonly startDate?: Date;
  readonly targetEndDate?: Date;
  readonly completedAt?: Date;
  readonly deletedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
