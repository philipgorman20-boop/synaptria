import {
  Prisma,
  type Program as PrismaProgram,
  type PrismaClient,
} from '@prisma/client';
import {
  identifier,
  type OrganizationId,
  type ProgramId,
  userId,
} from '@synaptria/core';
import { NotFoundError } from '@synaptria/core/errors';
import type {
  CreateProgramInput,
  Program,
  ProgramPriority,
  ProgramRepository,
  ProgramStatus,
  UpdateProgramInput,
} from '@synaptria/domain/programs';

import { throwUniqueConstraintConflict } from '../prisma-errors';

export type ProgramDatabaseClient = Pick<PrismaClient, 'program'>;

const PROGRAM_SELECT = {
  id: true,
  organizationId: true,
  ownerId: true,
  name: true,
  code: true,
  description: true,
  indication: true,
  modality: true,
  target: true,
  status: true,
  priority: true,
  startDate: true,
  targetEndDate: true,
  completedAt: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.ProgramSelect;

type SelectedProgram = Prisma.ProgramGetPayload<{ select: typeof PROGRAM_SELECT }>;

const PROGRAM_UNIQUE_CONFLICTS = {
  name: 'A program with this name already exists.',
  code: 'A program with this code already exists.',
} as const;

const activeProgramWhere = (
  organizationId: OrganizationId,
): Prisma.ProgramWhereInput => ({
  organizationId,
  deletedAt: null,
});

export class PrismaProgramRepository implements ProgramRepository {
  constructor(private readonly client: ProgramDatabaseClient) {}

  async create(input: CreateProgramInput): Promise<Program> {
    const data: Prisma.ProgramUncheckedCreateInput = {
      organizationId: input.organizationId,
      name: input.name,
      status: input.status ?? 'CONCEPT',
      priority: input.priority ?? 'MEDIUM',
      ...(input.ownerId === undefined ? {} : { ownerId: input.ownerId }),
      ...(input.code === undefined ? {} : { code: input.code }),
      ...(input.description === undefined ? {} : { description: input.description }),
      ...(input.indication === undefined ? {} : { indication: input.indication }),
      ...(input.modality === undefined ? {} : { modality: input.modality }),
      ...(input.target === undefined ? {} : { target: input.target }),
      ...(input.startDate === undefined ? {} : { startDate: input.startDate }),
      ...(input.targetEndDate === undefined
        ? {}
        : { targetEndDate: input.targetEndDate }),
    };

    try {
      const row = await this.client.program.create({
        data,
        select: PROGRAM_SELECT,
      });
      return mapProgram(row);
    } catch (error) {
      throwUniqueConstraintConflict(error, PROGRAM_UNIQUE_CONFLICTS, 'name');
    }
  }

  async findById(
    organizationId: OrganizationId,
    id: ProgramId,
  ): Promise<Program | null> {
    const row = await this.client.program.findFirst({
      where: {
        ...activeProgramWhere(organizationId),
        id,
      },
      select: PROGRAM_SELECT,
    });
    return row === null ? null : mapProgram(row);
  }

  async findByName(
    organizationId: OrganizationId,
    name: string,
  ): Promise<Program | null> {
    const row = await this.client.program.findFirst({
      where: {
        ...activeProgramWhere(organizationId),
        name,
      },
      select: PROGRAM_SELECT,
    });
    return row === null ? null : mapProgram(row);
  }

  async findByCode(
    organizationId: OrganizationId,
    code: string,
  ): Promise<Program | null> {
    const row = await this.client.program.findFirst({
      where: {
        ...activeProgramWhere(organizationId),
        code,
      },
      select: PROGRAM_SELECT,
    });
    return row === null ? null : mapProgram(row);
  }

  async update(
    organizationId: OrganizationId,
    id: ProgramId,
    input: UpdateProgramInput,
  ): Promise<Program> {
    const existing = await this.findById(organizationId, id);
    if (existing === null) {
      throw new NotFoundError('Program', { programId: id, organizationId });
    }

    const data: Prisma.ProgramUpdateInput = {
      ...(input.name === undefined ? {} : { name: input.name }),
      ...(input.code === undefined ? {} : { code: input.code }),
      ...(input.description === undefined ? {} : { description: input.description }),
      ...(input.indication === undefined ? {} : { indication: input.indication }),
      ...(input.modality === undefined ? {} : { modality: input.modality }),
      ...(input.target === undefined ? {} : { target: input.target }),
      ...(input.status === undefined ? {} : { status: input.status }),
      ...(input.priority === undefined ? {} : { priority: input.priority }),
      ...(input.ownerId === undefined ? {} : { ownerId: input.ownerId }),
      ...(input.startDate === undefined ? {} : { startDate: input.startDate }),
      ...(input.targetEndDate === undefined
        ? {}
        : { targetEndDate: input.targetEndDate }),
      ...(input.completedAt === undefined ? {} : { completedAt: input.completedAt }),
    };

    try {
      const row = await this.client.program.update({
        where: { id },
        data,
        select: PROGRAM_SELECT,
      });
      return mapProgram(row);
    } catch (error) {
      throwUniqueConstraintConflict(error, PROGRAM_UNIQUE_CONFLICTS, 'name');
    }
  }

  async softDelete(
    organizationId: OrganizationId,
    id: ProgramId,
    deletedAt: Date,
  ): Promise<Program> {
    const existing = await this.findById(organizationId, id);
    if (existing === null) {
      throw new NotFoundError('Program', { programId: id, organizationId });
    }

    const row = await this.client.program.update({
      where: { id },
      data: { deletedAt },
      select: PROGRAM_SELECT,
    });
    return mapProgram(row);
  }

  async listForOrganization(
    organizationId: OrganizationId,
  ): Promise<readonly Program[]> {
    const rows = await this.client.program.findMany({
      where: activeProgramWhere(organizationId),
      select: PROGRAM_SELECT,
      orderBy: [{ name: 'asc' }, { code: 'asc' }],
    });
    return rows.map(mapProgram);
  }
}

export function mapProgram(row: SelectedProgram | PrismaProgram): Program {
  return {
    id: identifier(row.id, 'ProgramId') as ProgramId,
    organizationId: identifier(row.organizationId, 'OrganizationId') as OrganizationId,
    ...(row.ownerId === null ? {} : { ownerId: userId(row.ownerId) }),
    name: row.name,
    ...(row.code === null ? {} : { code: row.code }),
    ...(row.description === null ? {} : { description: row.description }),
    ...(row.indication === null ? {} : { indication: row.indication }),
    ...(row.modality === null ? {} : { modality: row.modality }),
    ...(row.target === null ? {} : { target: row.target }),
    status: row.status as ProgramStatus,
    priority: row.priority as ProgramPriority,
    ...(row.startDate === null ? {} : { startDate: row.startDate }),
    ...(row.targetEndDate === null ? {} : { targetEndDate: row.targetEndDate }),
    ...(row.completedAt === null ? {} : { completedAt: row.completedAt }),
    ...(row.deletedAt === null ? {} : { deletedAt: row.deletedAt }),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
