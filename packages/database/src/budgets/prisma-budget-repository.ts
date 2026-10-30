import type { Prisma, PrismaClient } from '@prisma/client';
import { budgetId } from '@synaptria/core';
import type { BudgetId, OrganizationId } from '@synaptria/core';
import type { Budget, BudgetRepository } from '@synaptria/domain/budgets';
import type { CreateBudgetInput, UpdateBudgetInput } from '@synaptria/domain/budgets';

import { throwUniqueConstraintConflict } from '../prisma-errors';

const BUDGET_SELECT = {
  id: true,
  organizationId: true,
  name: true,
  description: true,
  status: true,
  periodType: true,
  currency: true,
  startDate: true,
  endDate: true,
  approvedAt: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.BudgetSelect;

type BudgetRow = Prisma.BudgetGetPayload<{ select: typeof BUDGET_SELECT }>;

function mapBudget(row: BudgetRow): Budget {
  return {
    id: budgetId(row.id),
    organizationId: row.organizationId as OrganizationId,
    name: row.name,
    ...(row.description === null ? {} : { description: row.description }),
    status: row.status,
    periodType: row.periodType,
    currency: row.currency,
    startDate: row.startDate,
    endDate: row.endDate,
    ...(row.approvedAt === null ? {} : { approvedAt: row.approvedAt }),
    ...(row.deletedAt === null ? {} : { deletedAt: row.deletedAt }),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaBudgetRepository implements BudgetRepository {
  constructor(private readonly client: PrismaClient | Prisma.TransactionClient) {}

  async create(input: CreateBudgetInput): Promise<Budget> {
    try {
      const row = await this.client.budget.create({
        data: {
          organizationId: input.organizationId,
          name: input.name,
          ...(input.description === undefined ? {} : { description: input.description }),
          ...(input.status === undefined ? {} : { status: input.status }),
          ...(input.periodType === undefined ? {} : { periodType: input.periodType }),
          ...(input.currency === undefined ? {} : { currency: input.currency }),
          startDate: input.startDate,
          endDate: input.endDate,
        },
        select: BUDGET_SELECT,
      });
      return mapBudget(row);
    } catch (error) {
      throwUniqueConstraintConflict(error, { name: 'A budget with this name already exists.' }, 'name');
      throw error;
    }
  }

  async findById(organizationId: OrganizationId, id: BudgetId): Promise<Budget | null> {
    const row = await this.client.budget.findFirst({
      where: { id, organizationId },
      select: BUDGET_SELECT,
    });
    return row === null ? null : mapBudget(row);
  }

  async update(organizationId: OrganizationId, id: BudgetId, input: UpdateBudgetInput): Promise<Budget> {
    try {
      const row = await this.client.budget.update({
        where: { id, organizationId },
        data: {
          ...(input.name === undefined ? {} : { name: input.name }),
          ...(input.description === undefined ? {} : { description: input.description }),
          ...(input.status === undefined ? {} : { status: input.status }),
          ...(input.periodType === undefined ? {} : { periodType: input.periodType }),
          ...(input.currency === undefined ? {} : { currency: input.currency }),
          ...(input.startDate === undefined ? {} : { startDate: input.startDate }),
          ...(input.endDate === undefined ? {} : { endDate: input.endDate }),
          ...(input.approvedAt === undefined ? {} : { approvedAt: input.approvedAt }),
        },
        select: BUDGET_SELECT,
      });
      return mapBudget(row);
    } catch (error) {
      throwUniqueConstraintConflict(error, { name: 'A budget with this name already exists.' }, 'name');
      throw error;
    }
  }

  async softDelete(organizationId: OrganizationId, id: BudgetId): Promise<void> {
    await this.client.budget.update({
      where: { id, organizationId },
      data: { deletedAt: new Date() },
    });
  }

  async listForOrganization(organizationId: OrganizationId): Promise<readonly Budget[]> {
    const rows = await this.client.budget.findMany({
      where: { organizationId },
      select: BUDGET_SELECT,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapBudget);
  }
}
