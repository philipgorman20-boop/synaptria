import type {
  DecisionId,
  MilestoneId,
  OrganizationId,
  ProgramId,
  ProjectId,
  UserId,
} from '@synaptria/core';

import type { Decision, DecisionStatus } from './models';

export interface CreateDecisionInput {
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
  readonly status?: DecisionStatus;
  readonly decisionDate?: Date;
  readonly effectiveDate?: Date;
}

export interface UpdateDecisionInput {
  readonly title?: string;
  readonly context?: string | null;
  readonly decision?: string | null;
  readonly rationale?: string | null;
  readonly alternatives?: string | null;
  readonly status?: DecisionStatus;
  readonly decisionDate?: Date | null;
  readonly effectiveDate?: Date | null;
  readonly ownerId?: UserId | null;
  readonly programId?: ProgramId | null;
  readonly projectId?: ProjectId | null;
  readonly milestoneId?: MilestoneId | null;
}

export interface DecisionRepository {
  create(input: CreateDecisionInput): Promise<Decision>;
  findById(organizationId: OrganizationId, id: DecisionId): Promise<Decision | null>;
  update(organizationId: OrganizationId, id: DecisionId, input: UpdateDecisionInput): Promise<Decision>;
  softDelete(organizationId: OrganizationId, id: DecisionId, deletedAt: Date): Promise<Decision>;
  listForOrganization(organizationId: OrganizationId): Promise<readonly Decision[]>;
  listForProject(organizationId: OrganizationId, projectId: ProjectId): Promise<readonly Decision[]>;
  listForProgram(organizationId: OrganizationId, programId: ProgramId): Promise<readonly Decision[]>;
}
