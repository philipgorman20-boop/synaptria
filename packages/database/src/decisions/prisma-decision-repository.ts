import {
  Prisma,
  type Decision as PrismaDecision,
  type PrismaClient,
} from '@prisma/client';
import {
  decisionId,
  identifier,
  milestoneId,
  programId,
  projectId,
  userId,
  type DecisionId,
  type OrganizationId,
  type ProgramId,
  type ProjectId,
} from '@synaptria/core';
import { NotFoundError } from '@synaptria/core/errors';
import type {
  CreateDecisionInput,
  Decision,
  DecisionRepository,
  DecisionStatus,
  UpdateDecisionInput,
} from '@synaptria/domain/decisions';

export type DecisionDatabaseClient = Pick<PrismaClient, 'decision'>;

const DECISION_SELECT = {
  id: true,
  organizationId: true,
  programId: true,
  projectId: true,
  milestoneId: true,
  ownerId: true,
  createdById: true,
  title: true,
  context: true,
  decision: true,
  rationale: true,
  alternatives: true,
  status: true,
  decisionDate: true,
  effectiveDate: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.DecisionSelect;

type SelectedDecision = Prisma.DecisionGetPayload<{ select: typeof DECISION_SELECT }>;

const activeDecisionWhere = (organizationId: OrganizationId): Prisma.DecisionWhereInput => ({
  organizationId,
  deletedAt: null,
});

export class PrismaDecisionRepository implements DecisionRepository {
  constructor(private readonly client: DecisionDatabaseClient) {}

  async create(input: CreateDecisionInput): Promise<Decision> {
    const data: Prisma.DecisionUncheckedCreateInput = {
      organizationId: input.organizationId,
      title: input.title,
      status: input.status ?? 'PROPOSED',
      ...(input.programId === undefined ? {} : { programId: input.programId }),
      ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
      ...(input.milestoneId === undefined ? {} : { milestoneId: input.milestoneId }),
      ...(input.ownerId === undefined ? {} : { ownerId: input.ownerId }),
      ...(input.createdById === undefined ? {} : { createdById: input.createdById }),
      ...(input.context === undefined ? {} : { context: input.context }),
      ...(input.decision === undefined ? {} : { decision: input.decision }),
      ...(input.rationale === undefined ? {} : { rationale: input.rationale }),
      ...(input.alternatives === undefined ? {} : { alternatives: input.alternatives }),
      ...(input.decisionDate === undefined ? {} : { decisionDate: input.decisionDate }),
      ...(input.effectiveDate === undefined ? {} : { effectiveDate: input.effectiveDate }),
    };

    const row = await this.client.decision.create({ data, select: DECISION_SELECT });
    return mapDecision(row);
  }

  async findById(organizationId: OrganizationId, id: DecisionId): Promise<Decision | null> {
    const row = await this.client.decision.findFirst({
      where: { ...activeDecisionWhere(organizationId), id },
      select: DECISION_SELECT,
    });
    return row === null ? null : mapDecision(row);
  }

  async update(organizationId: OrganizationId, id: DecisionId, input: UpdateDecisionInput): Promise<Decision> {
    const existing = await this.findById(organizationId, id);
    if (existing === null) throw new NotFoundError('Decision', { decisionId: id, organizationId });

    const data: Prisma.DecisionUpdateInput = {
      ...(input.title === undefined ? {} : { title: input.title }),
      ...(input.context === undefined ? {} : { context: input.context }),
      ...(input.decision === undefined ? {} : { decision: input.decision }),
      ...(input.rationale === undefined ? {} : { rationale: input.rationale }),
      ...(input.alternatives === undefined ? {} : { alternatives: input.alternatives }),
      ...(input.status === undefined ? {} : { status: input.status }),
      ...(input.decisionDate === undefined ? {} : { decisionDate: input.decisionDate }),
      ...(input.effectiveDate === undefined ? {} : { effectiveDate: input.effectiveDate }),
      ...(input.ownerId === undefined ? {} : { ownerId: input.ownerId }),
      ...(input.programId === undefined ? {} : { programId: input.programId }),
      ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
      ...(input.milestoneId === undefined ? {} : { milestoneId: input.milestoneId }),
    };

    const row = await this.client.decision.update({ where: { id }, data, select: DECISION_SELECT });
    return mapDecision(row);
  }

  async softDelete(organizationId: OrganizationId, id: DecisionId, deletedAt: Date): Promise<Decision> {
    const existing = await this.findById(organizationId, id);
    if (existing === null) throw new NotFoundError('Decision', { decisionId: id, organizationId });

    const row = await this.client.decision.update({ where: { id }, data: { deletedAt }, select: DECISION_SELECT });
    return mapDecision(row);
  }

  async listForOrganization(organizationId: OrganizationId): Promise<readonly Decision[]> {
    const rows = await this.client.decision.findMany({
      where: activeDecisionWhere(organizationId),
      select: DECISION_SELECT,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
    return rows.map(mapDecision);
  }

  async listForProject(organizationId: OrganizationId, pid: ProjectId): Promise<readonly Decision[]> {
    const rows = await this.client.decision.findMany({
      where: { ...activeDecisionWhere(organizationId), projectId: pid },
      select: DECISION_SELECT,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
    return rows.map(mapDecision);
  }

  async listForProgram(organizationId: OrganizationId, pid: ProgramId): Promise<readonly Decision[]> {
    const rows = await this.client.decision.findMany({
      where: { ...activeDecisionWhere(organizationId), programId: pid },
      select: DECISION_SELECT,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
    return rows.map(mapDecision);
  }
}

export function mapDecision(row: SelectedDecision | PrismaDecision): Decision {
  return {
    id: decisionId(row.id),
    organizationId: identifier(row.organizationId, 'OrganizationId') as OrganizationId,
    ...(row.programId === null ? {} : { programId: programId(row.programId) }),
    ...(row.projectId === null ? {} : { projectId: projectId(row.projectId) }),
    ...(row.milestoneId === null ? {} : { milestoneId: milestoneId(row.milestoneId) }),
    ...(row.ownerId === null ? {} : { ownerId: userId(row.ownerId) }),
    ...(row.createdById === null ? {} : { createdById: userId(row.createdById) }),
    title: row.title,
    ...(row.context === null ? {} : { context: row.context }),
    ...(row.decision === null ? {} : { decision: row.decision }),
    ...(row.rationale === null ? {} : { rationale: row.rationale }),
    ...(row.alternatives === null ? {} : { alternatives: row.alternatives }),
    status: row.status as DecisionStatus,
    ...(row.decisionDate === null ? {} : { decisionDate: row.decisionDate }),
    ...(row.effectiveDate === null ? {} : { effectiveDate: row.effectiveDate }),
    ...(row.deletedAt === null ? {} : { deletedAt: row.deletedAt }),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
