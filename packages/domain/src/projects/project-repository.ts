import type {
  OrganizationId,
  ProgramId,
  ProjectId,
  UserId,
} from '@synaptria/core';

import type { Project, ProjectPriority, ProjectStatus } from './models';

export interface CreateProjectInput {
  readonly organizationId: OrganizationId;
  readonly programId?: ProgramId;
  readonly ownerId?: UserId;
  readonly name: string;
  readonly code?: string;
  readonly description?: string;
  readonly status?: ProjectStatus;
  readonly priority?: ProjectPriority;
  readonly percentComplete?: number;
  readonly startDate?: Date;
  readonly targetEndDate?: Date;
}

export interface UpdateProjectInput {
  readonly name?: string;
  readonly code?: string | null;
  readonly description?: string | null;
  readonly programId?: ProgramId | null;
  readonly status?: ProjectStatus;
  readonly priority?: ProjectPriority;
  readonly ownerId?: UserId | null;
  readonly percentComplete?: number;
  readonly startDate?: Date | null;
  readonly targetEndDate?: Date | null;
  readonly completedAt?: Date | null;
}

export interface ProjectRepository {
  create(input: CreateProjectInput): Promise<Project>;
  findById(
    organizationId: OrganizationId,
    id: ProjectId,
  ): Promise<Project | null>;
  findByName(
    organizationId: OrganizationId,
    name: string,
  ): Promise<Project | null>;
  findByCode(
    organizationId: OrganizationId,
    code: string,
  ): Promise<Project | null>;
  update(
    organizationId: OrganizationId,
    id: ProjectId,
    input: UpdateProjectInput,
  ): Promise<Project>;
  softDelete(
    organizationId: OrganizationId,
    id: ProjectId,
    deletedAt: Date,
  ): Promise<Project>;
  listForOrganization(
    organizationId: OrganizationId,
  ): Promise<readonly Project[]>;
  listForProgram(
    organizationId: OrganizationId,
    programId: ProgramId,
  ): Promise<readonly Project[]>;
}
