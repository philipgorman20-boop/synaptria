import {
  Prisma,
  type Project as PrismaProject,
  type PrismaClient,
} from '@prisma/client';
import {
  identifier,
  type OrganizationId,
  type ProgramId,
  type ProjectId,
  programId,
  userId,
} from '@synaptria/core';
import { NotFoundError } from '@synaptria/core/errors';
import type {
  CreateProjectInput,
  Project,
  ProjectPriority,
  ProjectRepository,
  ProjectStatus,
  UpdateProjectInput,
} from '@synaptria/domain/projects';

import { throwUniqueConstraintConflict } from '../prisma-errors';

export type ProjectDatabaseClient = Pick<PrismaClient, 'project'>;

const PROJECT_SELECT = {
  id: true,
  organizationId: true,
  programId: true,
  ownerId: true,
  name: true,
  code: true,
  description: true,
  status: true,
  priority: true,
  percentComplete: true,
  startDate: true,
  targetEndDate: true,
  completedAt: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.ProjectSelect;

type SelectedProject = Prisma.ProjectGetPayload<{ select: typeof PROJECT_SELECT }>;

const PROJECT_UNIQUE_CONFLICTS = {
  name: 'A project with this name already exists.',
  code: 'A project with this code already exists.',
} as const;

const activeProjectWhere = (
  organizationId: OrganizationId,
): Prisma.ProjectWhereInput => ({
  organizationId,
  deletedAt: null,
});

export class PrismaProjectRepository implements ProjectRepository {
  constructor(private readonly client: ProjectDatabaseClient) {}

  async create(input: CreateProjectInput): Promise<Project> {
    const data: Prisma.ProjectUncheckedCreateInput = {
      organizationId: input.organizationId,
      name: input.name,
      ...(input.programId === undefined ? {} : { programId: input.programId }),
      ...(input.ownerId === undefined ? {} : { ownerId: input.ownerId }),
      ...(input.code === undefined ? {} : { code: input.code }),
      ...(input.description === undefined
        ? {}
        : { description: input.description }),
      ...(input.status === undefined ? {} : { status: input.status }),
      ...(input.priority === undefined ? {} : { priority: input.priority }),
      ...(input.percentComplete === undefined
        ? {}
        : { percentComplete: input.percentComplete }),
      ...(input.startDate === undefined ? {} : { startDate: input.startDate }),
      ...(input.targetEndDate === undefined
        ? {}
        : { targetEndDate: input.targetEndDate }),
    };

    try {
      const row = await this.client.project.create({
        data,
        select: PROJECT_SELECT,
      });
      return mapProject(row);
    } catch (error) {
      throwUniqueConstraintConflict(error, PROJECT_UNIQUE_CONFLICTS, 'name');
    }
  }

  async findById(
    organizationId: OrganizationId,
    id: ProjectId,
  ): Promise<Project | null> {
    const row = await this.client.project.findFirst({
      where: {
        ...activeProjectWhere(organizationId),
        id,
      },
      select: PROJECT_SELECT,
    });
    return row === null ? null : mapProject(row);
  }

  async findByName(
    organizationId: OrganizationId,
    name: string,
  ): Promise<Project | null> {
    const row = await this.client.project.findFirst({
      where: {
        ...activeProjectWhere(organizationId),
        name,
      },
      select: PROJECT_SELECT,
    });
    return row === null ? null : mapProject(row);
  }

  async findByCode(
    organizationId: OrganizationId,
    code: string,
  ): Promise<Project | null> {
    const row = await this.client.project.findFirst({
      where: {
        ...activeProjectWhere(organizationId),
        code,
      },
      select: PROJECT_SELECT,
    });
    return row === null ? null : mapProject(row);
  }

  async update(
    organizationId: OrganizationId,
    id: ProjectId,
    input: UpdateProjectInput,
  ): Promise<Project> {
    const existing = await this.findById(organizationId, id);
    if (existing === null) {
      throw new NotFoundError('Project', { projectId: id, organizationId });
    }

    const data: Prisma.ProjectUpdateInput = {
      ...(input.name === undefined ? {} : { name: input.name }),
      ...(input.code === undefined ? {} : { code: input.code }),
      ...(input.description === undefined
        ? {}
        : { description: input.description }),
      ...(input.programId === undefined ? {} : { programId: input.programId }),
      ...(input.status === undefined ? {} : { status: input.status }),
      ...(input.priority === undefined ? {} : { priority: input.priority }),
      ...(input.ownerId === undefined ? {} : { ownerId: input.ownerId }),
      ...(input.percentComplete === undefined
        ? {}
        : { percentComplete: input.percentComplete }),
      ...(input.startDate === undefined ? {} : { startDate: input.startDate }),
      ...(input.targetEndDate === undefined
        ? {}
        : { targetEndDate: input.targetEndDate }),
      ...(input.completedAt === undefined
        ? {}
        : { completedAt: input.completedAt }),
    };

    try {
      const row = await this.client.project.update({
        where: { id },
        data,
        select: PROJECT_SELECT,
      });
      return mapProject(row);
    } catch (error) {
      throwUniqueConstraintConflict(error, PROJECT_UNIQUE_CONFLICTS, 'name');
    }
  }

  async softDelete(
    organizationId: OrganizationId,
    id: ProjectId,
    deletedAt: Date,
  ): Promise<Project> {
    const existing = await this.findById(organizationId, id);
    if (existing === null) {
      throw new NotFoundError('Project', { projectId: id, organizationId });
    }

    const row = await this.client.project.update({
      where: { id },
      data: { deletedAt },
      select: PROJECT_SELECT,
    });
    return mapProject(row);
  }

  async listForOrganization(
    organizationId: OrganizationId,
  ): Promise<readonly Project[]> {
    const rows = await this.client.project.findMany({
      where: activeProjectWhere(organizationId),
      select: PROJECT_SELECT,
      orderBy: [{ name: 'asc' }, { code: 'asc' }],
    });
    return rows.map(mapProject);
  }

  async listForProgram(
    organizationId: OrganizationId,
    programId: ProgramId,
  ): Promise<readonly Project[]> {
    const rows = await this.client.project.findMany({
      where: {
        ...activeProjectWhere(organizationId),
        programId,
      },
      select: PROJECT_SELECT,
      orderBy: [{ name: 'asc' }, { code: 'asc' }],
    });
    return rows.map(mapProject);
  }
}

export function mapProject(row: SelectedProject | PrismaProject): Project {
  return {
    id: identifier(row.id, 'ProjectId') as ProjectId,
    organizationId: identifier(row.organizationId, 'OrganizationId') as OrganizationId,
    ...(row.programId === null ? {} : { programId: programId(row.programId) }),
    ...(row.ownerId === null ? {} : { ownerId: userId(row.ownerId) }),
    name: row.name,
    ...(row.code === null ? {} : { code: row.code }),
    ...(row.description === null ? {} : { description: row.description }),
    status: row.status as ProjectStatus,
    priority: row.priority as ProjectPriority,
    percentComplete: row.percentComplete,
    ...(row.startDate === null ? {} : { startDate: row.startDate }),
    ...(row.targetEndDate === null ? {} : { targetEndDate: row.targetEndDate }),
    ...(row.completedAt === null ? {} : { completedAt: row.completedAt }),
    ...(row.deletedAt === null ? {} : { deletedAt: row.deletedAt }),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
