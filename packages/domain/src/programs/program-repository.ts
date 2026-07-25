import type { OrganizationId, ProgramId, UserId } from '@synaptria/core';

import type { Program, ProgramPriority, ProgramStatus } from './models';

export interface CreateProgramInput {
  readonly organizationId: OrganizationId;
  readonly ownerId?: UserId;
  readonly name: string;
  readonly code?: string;
  readonly description?: string;
  readonly indication?: string;
  readonly modality?: string;
  readonly target?: string;
  readonly status?: ProgramStatus;
  readonly priority?: ProgramPriority;
  readonly startDate?: Date;
  readonly targetEndDate?: Date;
}

export interface UpdateProgramInput {
  readonly name?: string;
  readonly code?: string | null;
  readonly description?: string | null;
  readonly indication?: string | null;
  readonly modality?: string | null;
  readonly target?: string | null;
  readonly status?: ProgramStatus;
  readonly priority?: ProgramPriority;
  readonly ownerId?: UserId | null;
  readonly startDate?: Date | null;
  readonly targetEndDate?: Date | null;
  readonly completedAt?: Date | null;
}

export interface ProgramRepository {
  create(input: CreateProgramInput): Promise<Program>;
  findById(organizationId: OrganizationId, id: ProgramId): Promise<Program | null>;
  findByName(organizationId: OrganizationId, name: string): Promise<Program | null>;
  findByCode(organizationId: OrganizationId, code: string): Promise<Program | null>;
  update(
    organizationId: OrganizationId,
    id: ProgramId,
    input: UpdateProgramInput,
  ): Promise<Program>;
  softDelete(
    organizationId: OrganizationId,
    id: ProgramId,
    deletedAt: Date,
  ): Promise<Program>;
  listForOrganization(organizationId: OrganizationId): Promise<readonly Program[]>;
}
