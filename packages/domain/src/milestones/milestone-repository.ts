import type {
  MilestoneId,
  OrganizationId,
  ProjectId,
} from '@synaptria/core';

import type {
  Milestone,
  MilestonePriority,
  MilestoneStatus,
} from './models';

export interface CreateMilestoneInput {
  readonly organizationId: OrganizationId;
  readonly projectId: ProjectId;
  readonly name: string;
  readonly description?: string;
  readonly status?: MilestoneStatus;
  readonly priority?: MilestonePriority;
  readonly plannedStartDate?: Date;
  readonly plannedEndDate?: Date;
  readonly actualStartDate?: Date;
  readonly actualEndDate?: Date;
}

export interface UpdateMilestoneInput {
  readonly name?: string;
  readonly description?: string | null;
  readonly status?: MilestoneStatus;
  readonly priority?: MilestonePriority;
  readonly plannedStartDate?: Date | null;
  readonly plannedEndDate?: Date | null;
  readonly actualStartDate?: Date | null;
  readonly actualEndDate?: Date | null;
}

export interface MilestoneRepository {
  create(input: CreateMilestoneInput): Promise<Milestone>;
  findById(
    organizationId: OrganizationId,
    id: MilestoneId,
  ): Promise<Milestone | null>;
  update(
    organizationId: OrganizationId,
    id: MilestoneId,
    input: UpdateMilestoneInput,
  ): Promise<Milestone>;
  listForOrganization(
    organizationId: OrganizationId,
  ): Promise<readonly Milestone[]>;
  listForProject(
    organizationId: OrganizationId,
    projectId: ProjectId,
  ): Promise<readonly Milestone[]>;
}
