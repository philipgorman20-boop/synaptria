import type {
  DecisionId,
  MilestoneId,
  OrganizationId,
  ProgramId,
  ProjectId,
  UserId,
} from '@synaptria/core';

export type DecisionStatus = 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED';

export interface Decision {
  readonly id: DecisionId;
  readonly organizationId: OrganizationId;
  readonly programId?: ProgramId;
  readonly projectId?: ProjectId;
  readonly milestoneId?: MilestoneId;
  readonly ownerId?: UserId;
  readonly createdById?: UserId;
  readonly title: string;
  readonly context?: string;
  readonly decision?: string;
  readonly rationale?: string;
  readonly alternatives?: string;
  readonly status: DecisionStatus;
  readonly decisionDate?: Date;
  readonly effectiveDate?: Date;
  readonly deletedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
