import {
  Prisma,
  type Milestone as PrismaMilestone,
  type PrismaClient,
} from '@prisma/client';
import {
  identifier,
  type MilestoneId,
  type OrganizationId,
  type ProjectId,
  projectId,
} from '@synaptria/core';
import { NotFoundError } from '@synaptria/core/errors';
import type {
  CreateMilestoneInput,
  Milestone,
  MilestonePriority,
  MilestoneRepository,
  MilestoneStatus,
  UpdateMilestoneInput,
} from '@synaptria/domain/milestones';

export type MilestoneDatabaseClient = Pick<PrismaClient, 'milestone'>;

const MILESTONE_SELECT = {
  id: true,
  organizationId: true,
  projectId: true,
  name: true,
  description: true,
  status: true,
  priority: true,
  plannedStartDate: true,
  plannedEndDate: true,
  actualStartDate: true,
  actualEndDate: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.MilestoneSelect;

type SelectedMilestone = Prisma.MilestoneGetPayload<{
  select: typeof MILESTONE_SELECT;
}>;

const activeMilestoneWhere = (
  organizationId: OrganizationId,
): Prisma.MilestoneWhereInput => ({
  organizationId,
  deletedAt: null,
});

export class PrismaMilestoneRepository implements MilestoneRepository {
  constructor(private readonly client: MilestoneDatabaseClient) {}

  async create(input: CreateMilestoneInput): Promise<Milestone> {
    const data: Prisma.MilestoneUncheckedCreateInput = {
      organizationId: input.organizationId,
      projectId: input.projectId,
      name: input.name,
      ...(input.description === undefined
        ? {}
        : { description: input.description }),
      ...(input.status === undefined ? {} : { status: input.status }),
      ...(input.priority === undefined ? {} : { priority: input.priority }),
      ...(input.plannedStartDate === undefined
        ? {}
        : { plannedStartDate: input.plannedStartDate }),
      ...(input.plannedEndDate === undefined
        ? {}
        : { plannedEndDate: input.plannedEndDate }),
      ...(input.actualStartDate === undefined
        ? {}
        : { actualStartDate: input.actualStartDate }),
      ...(input.actualEndDate === undefined
        ? {}
        : { actualEndDate: input.actualEndDate }),
    };

    const row = await this.client.milestone.create({
      data,
      select: MILESTONE_SELECT,
    });
    return mapMilestone(row);
  }

  async findById(
    organizationId: OrganizationId,
    id: MilestoneId,
  ): Promise<Milestone | null> {
    const row = await this.client.milestone.findFirst({
      where: {
        ...activeMilestoneWhere(organizationId),
        id,
      },
      select: MILESTONE_SELECT,
    });
    return row === null ? null : mapMilestone(row);
  }

  async update(
    organizationId: OrganizationId,
    id: MilestoneId,
    input: UpdateMilestoneInput,
  ): Promise<Milestone> {
    const existing = await this.findById(organizationId, id);
    if (existing === null) {
      throw new NotFoundError('Milestone', { milestoneId: id, organizationId });
    }

    const data: Prisma.MilestoneUpdateInput = {
      ...(input.name === undefined ? {} : { name: input.name }),
      ...(input.description === undefined
        ? {}
        : { description: input.description }),
      ...(input.status === undefined ? {} : { status: input.status }),
      ...(input.priority === undefined ? {} : { priority: input.priority }),
      ...(input.plannedStartDate === undefined
        ? {}
        : { plannedStartDate: input.plannedStartDate }),
      ...(input.plannedEndDate === undefined
        ? {}
        : { plannedEndDate: input.plannedEndDate }),
      ...(input.actualStartDate === undefined
        ? {}
        : { actualStartDate: input.actualStartDate }),
      ...(input.actualEndDate === undefined
        ? {}
        : { actualEndDate: input.actualEndDate }),
    };

    const result = await this.client.milestone.updateMany({
      where: {
        id,
        ...activeMilestoneWhere(organizationId),
      },
      data,
    });

    if (result.count === 0) {
      throw new NotFoundError('Milestone', { milestoneId: id, organizationId });
    }

    const row = await this.client.milestone.findFirst({
      where: {
        ...activeMilestoneWhere(organizationId),
        id,
      },
      select: MILESTONE_SELECT,
    });

    if (row === null) {
      throw new NotFoundError('Milestone', { milestoneId: id, organizationId });
    }

    return mapMilestone(row);
  }

  async listForOrganization(
    organizationId: OrganizationId,
  ): Promise<readonly Milestone[]> {
    const rows = await this.client.milestone.findMany({
      where: activeMilestoneWhere(organizationId),
      select: MILESTONE_SELECT,
    });
    return rows.map(mapMilestone);
  }

  async listForProject(
    organizationId: OrganizationId,
    projectIdValue: ProjectId,
  ): Promise<readonly Milestone[]> {
    const rows = await this.client.milestone.findMany({
      where: {
        ...activeMilestoneWhere(organizationId),
        projectId: projectIdValue,
      },
      select: MILESTONE_SELECT,
    });
    return rows.map(mapMilestone);
  }
}

export function mapMilestone(
  row: SelectedMilestone | PrismaMilestone,
): Milestone {
  return {
    id: identifier(row.id, 'MilestoneId') as MilestoneId,
    organizationId: identifier(row.organizationId, 'OrganizationId') as OrganizationId,
    projectId: projectId(row.projectId),
    name: row.name,
    ...(row.description === null ? {} : { description: row.description }),
    status: row.status as MilestoneStatus,
    priority: row.priority as MilestonePriority,
    ...(row.plannedStartDate === null
      ? {}
      : { plannedStartDate: row.plannedStartDate }),
    ...(row.plannedEndDate === null ? {} : { plannedEndDate: row.plannedEndDate }),
    ...(row.actualStartDate === null
      ? {}
      : { actualStartDate: row.actualStartDate }),
    ...(row.actualEndDate === null ? {} : { actualEndDate: row.actualEndDate }),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
