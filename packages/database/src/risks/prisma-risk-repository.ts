import {
  Prisma,
  type Risk as PrismaRisk,
  type PrismaClient,
} from '@prisma/client';
import {
  identifier,
  milestoneId,
  programId,
  projectId,
  riskId,
  userId,
  type OrganizationId,
  type RiskId,
} from '@synaptria/core';
import { NotFoundError } from '@synaptria/core/errors';
import type {
  CreateRiskInput,
  Risk,
  RiskCategory,
  RiskImpact,
  RiskProbability,
  RiskRepository,
  RiskStatus,
  UpdateRiskInput,
} from '@synaptria/domain/risks';
import type { ProgramId, ProjectId } from '@synaptria/core';

export type RiskDatabaseClient = Pick<PrismaClient, 'risk'>;

const RISK_SELECT = {
  id: true,
  organizationId: true,
  programId: true,
  projectId: true,
  milestoneId: true,
  ownerId: true,
  createdById: true,
  title: true,
  description: true,
  category: true,
  status: true,
  probability: true,
  impact: true,
  mitigationPlan: true,
  contingencyPlan: true,
  reviewDate: true,
  closedAt: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.RiskSelect;

type SelectedRisk = Prisma.RiskGetPayload<{ select: typeof RISK_SELECT }>;

const activeRiskWhere = (organizationId: OrganizationId): Prisma.RiskWhereInput => ({
  organizationId,
  deletedAt: null,
});

export class PrismaRiskRepository implements RiskRepository {
  constructor(private readonly client: RiskDatabaseClient) {}

  async create(input: CreateRiskInput): Promise<Risk> {
    const data: Prisma.RiskUncheckedCreateInput = {
      organizationId: input.organizationId,
      title: input.title,
      category: input.category,
      status: input.status ?? 'OPEN',
      probability: input.probability ?? 'POSSIBLE',
      impact: input.impact ?? 'MODERATE',
      ...(input.programId === undefined ? {} : { programId: input.programId }),
      ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
      ...(input.milestoneId === undefined ? {} : { milestoneId: input.milestoneId }),
      ...(input.ownerId === undefined ? {} : { ownerId: input.ownerId }),
      ...(input.createdById === undefined ? {} : { createdById: input.createdById }),
      ...(input.description === undefined ? {} : { description: input.description }),
      ...(input.mitigationPlan === undefined ? {} : { mitigationPlan: input.mitigationPlan }),
      ...(input.contingencyPlan === undefined ? {} : { contingencyPlan: input.contingencyPlan }),
      ...(input.reviewDate === undefined ? {} : { reviewDate: input.reviewDate }),
    };

    const row = await this.client.risk.create({ data, select: RISK_SELECT });
    return mapRisk(row);
  }

  async findById(organizationId: OrganizationId, id: RiskId): Promise<Risk | null> {
    const row = await this.client.risk.findFirst({
      where: { ...activeRiskWhere(organizationId), id },
      select: RISK_SELECT,
    });
    return row === null ? null : mapRisk(row);
  }

  async update(organizationId: OrganizationId, id: RiskId, input: UpdateRiskInput): Promise<Risk> {
    const existing = await this.findById(organizationId, id);
    if (existing === null) throw new NotFoundError('Risk', { riskId: id, organizationId });

    const data: Prisma.RiskUpdateInput = {
      ...(input.title === undefined ? {} : { title: input.title }),
      ...(input.description === undefined ? {} : { description: input.description }),
      ...(input.category === undefined ? {} : { category: input.category }),
      ...(input.status === undefined ? {} : { status: input.status }),
      ...(input.probability === undefined ? {} : { probability: input.probability }),
      ...(input.impact === undefined ? {} : { impact: input.impact }),
      ...(input.mitigationPlan === undefined ? {} : { mitigationPlan: input.mitigationPlan }),
      ...(input.contingencyPlan === undefined ? {} : { contingencyPlan: input.contingencyPlan }),
      ...(input.reviewDate === undefined ? {} : { reviewDate: input.reviewDate }),
      ...(input.closedAt === undefined ? {} : { closedAt: input.closedAt }),
      ...(input.ownerId === undefined ? {} : { ownerId: input.ownerId }),
      ...(input.programId === undefined ? {} : { programId: input.programId }),
      ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
      ...(input.milestoneId === undefined ? {} : { milestoneId: input.milestoneId }),
    };

    const row = await this.client.risk.update({ where: { id }, data, select: RISK_SELECT });
    return mapRisk(row);
  }

  async softDelete(organizationId: OrganizationId, id: RiskId, deletedAt: Date): Promise<Risk> {
    const existing = await this.findById(organizationId, id);
    if (existing === null) throw new NotFoundError('Risk', { riskId: id, organizationId });

    const row = await this.client.risk.update({ where: { id }, data: { deletedAt }, select: RISK_SELECT });
    return mapRisk(row);
  }

  async listForOrganization(organizationId: OrganizationId): Promise<readonly Risk[]> {
    const rows = await this.client.risk.findMany({
      where: activeRiskWhere(organizationId),
      select: RISK_SELECT,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
    return rows.map(mapRisk);
  }

  async listForProject(organizationId: OrganizationId, pid: ProjectId): Promise<readonly Risk[]> {
    const rows = await this.client.risk.findMany({
      where: { ...activeRiskWhere(organizationId), projectId: pid },
      select: RISK_SELECT,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
    return rows.map(mapRisk);
  }

  async listForProgram(organizationId: OrganizationId, pid: ProgramId): Promise<readonly Risk[]> {
    const rows = await this.client.risk.findMany({
      where: { ...activeRiskWhere(organizationId), programId: pid },
      select: RISK_SELECT,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
    return rows.map(mapRisk);
  }
}

export function mapRisk(row: SelectedRisk | PrismaRisk): Risk {
  return {
    id: riskId(row.id),
    organizationId: identifier(row.organizationId, 'OrganizationId') as OrganizationId,
    ...(row.programId === null ? {} : { programId: programId(row.programId) }),
    ...(row.projectId === null ? {} : { projectId: projectId(row.projectId) }),
    ...(row.milestoneId === null ? {} : { milestoneId: milestoneId(row.milestoneId) }),
    ...(row.ownerId === null ? {} : { ownerId: userId(row.ownerId) }),
    ...(row.createdById === null ? {} : { createdById: userId(row.createdById) }),
    title: row.title,
    ...(row.description === null ? {} : { description: row.description }),
    category: row.category as RiskCategory,
    status: row.status as RiskStatus,
    probability: row.probability as RiskProbability,
    impact: row.impact as RiskImpact,
    ...(row.mitigationPlan === null ? {} : { mitigationPlan: row.mitigationPlan }),
    ...(row.contingencyPlan === null ? {} : { contingencyPlan: row.contingencyPlan }),
    ...(row.reviewDate === null ? {} : { reviewDate: row.reviewDate }),
    ...(row.closedAt === null ? {} : { closedAt: row.closedAt }),
    ...(row.deletedAt === null ? {} : { deletedAt: row.deletedAt }),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
