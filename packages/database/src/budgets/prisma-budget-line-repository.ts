import type { Prisma, PrismaClient } from '@prisma/client';
import {
  budgetCategoryId,
  budgetId,
  budgetLineId,
  programId,
  projectId,
} from '@synaptria/core';
import type { BudgetId, BudgetLineId, OrganizationId } from '@synaptria/core';
import { NotFoundError } from '@synaptria/core/errors';
import type {
  BudgetLine,
  BudgetLineRepository,
  CreateBudgetLineInput,
  UpdateBudgetLineInput,
} from '@synaptria/domain/budgets';

const LINE_SELECT = {
  id: true,
  organizationId: true,
  budgetId: true,
  categoryId: true,
  programId: true,
  projectId: true,
  name: true,
  notes: true,
  plannedAmount: true,
  committedAmount: true,
  actualAmount: true,
  forecastAmount: true,
  currency: true,
  periodStart: true,
  periodEnd: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.BudgetLineSelect;

type LineRow = Prisma.BudgetLineGetPayload<{ select: typeof LINE_SELECT }>;

function mapLine(row: LineRow): BudgetLine {
  return {
    id: budgetLineId(row.id),
    organizationId: row.organizationId as OrganizationId,
    budgetId: budgetId(row.budgetId),
    categoryId: budgetCategoryId(row.categoryId),
    ...(row.programId === null ? {} : { programId: programId(row.programId) }),
    ...(row.projectId === null ? {} : { projectId: projectId(row.projectId) }),
    name: row.name,
    ...(row.notes === null ? {} : { notes: row.notes }),
    plannedAmount: Number(row.plannedAmount),
    committedAmount: Number(row.committedAmount),
    actualAmount: Number(row.actualAmount),
    forecastAmount: Number(row.forecastAmount),
    currency: row.currency,
    periodStart: row.periodStart,
    periodEnd: row.periodEnd,
    ...(row.deletedAt === null ? {} : { deletedAt: row.deletedAt }),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaBudgetLineRepository implements BudgetLineRepository {
  constructor(private readonly client: PrismaClient | Prisma.TransactionClient) {}

  async create(input: CreateBudgetLineInput): Promise<BudgetLine> {
    const row = await this.client.budgetLine.create({
      data: {
        organizationId: input.organizationId,
        budgetId: input.budgetId,
        categoryId: input.categoryId,
        name: input.name,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        ...(input.programId === undefined ? {} : { programId: input.programId }),
        ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
        ...(input.notes === undefined ? {} : { notes: input.notes }),
        ...(input.plannedAmount === undefined ? {} : { plannedAmount: input.plannedAmount }),
        ...(input.actualAmount === undefined ? {} : { actualAmount: input.actualAmount }),
        ...(input.currency === undefined ? {} : { currency: input.currency }),
      },
      select: LINE_SELECT,
    });
    return mapLine(row);
  }

  async findById(organizationId: OrganizationId, id: BudgetLineId): Promise<BudgetLine | null> {
    const row = await this.client.budgetLine.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: LINE_SELECT,
    });
    return row === null ? null : mapLine(row);
  }

  async update(organizationId: OrganizationId, id: BudgetLineId, input: UpdateBudgetLineInput): Promise<BudgetLine> {
    const existing = await this.findById(organizationId, id);
    if (existing === null) throw new NotFoundError('BudgetLine', { budgetLineId: id, organizationId });

    const row = await this.client.budgetLine.update({
      where: { id },
      data: {
        ...(input.categoryId === undefined ? {} : { categoryId: input.categoryId }),
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.notes === undefined ? {} : { notes: input.notes }),
        ...(input.plannedAmount === undefined ? {} : { plannedAmount: input.plannedAmount }),
        ...(input.actualAmount === undefined ? {} : { actualAmount: input.actualAmount }),
        ...(input.currency === undefined ? {} : { currency: input.currency }),
        ...(input.periodStart === undefined ? {} : { periodStart: input.periodStart }),
        ...(input.periodEnd === undefined ? {} : { periodEnd: input.periodEnd }),
        ...(input.programId === undefined ? {} : { programId: input.programId }),
        ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
      },
      select: LINE_SELECT,
    });
    return mapLine(row);
  }

  async softDelete(organizationId: OrganizationId, id: BudgetLineId): Promise<void> {
    await this.client.budgetLine.update({
      where: { id, organizationId },
      data: { deletedAt: new Date() },
    });
  }

  async listForBudget(organizationId: OrganizationId, bid: BudgetId): Promise<readonly BudgetLine[]> {
    const rows = await this.client.budgetLine.findMany({
      where: { organizationId, budgetId: bid, deletedAt: null },
      select: LINE_SELECT,
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(mapLine);
  }

  async listForOrganization(organizationId: OrganizationId): Promise<readonly BudgetLine[]> {
    const rows = await this.client.budgetLine.findMany({
      where: { organizationId, deletedAt: null },
      select: LINE_SELECT,
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(mapLine);
  }
}
