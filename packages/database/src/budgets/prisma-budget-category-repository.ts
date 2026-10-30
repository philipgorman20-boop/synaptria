import type { Prisma, PrismaClient } from '@prisma/client';
import { budgetCategoryId } from '@synaptria/core';
import type { BudgetCategoryId, OrganizationId } from '@synaptria/core';
import { NotFoundError } from '@synaptria/core/errors';
import type { BudgetCategory, BudgetCategoryOutflowType, BudgetCategoryRepository, CreateBudgetCategoryInput, UpdateBudgetCategoryInput } from '@synaptria/domain/budgets';

const CATEGORY_SELECT = {
  id: true,
  organizationId: true,
  parentId: true,
  name: true,
  code: true,
  description: true,
  isActive: true,
  outflowType: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.BudgetCategorySelect;

type CategoryRow = Prisma.BudgetCategoryGetPayload<{ select: typeof CATEGORY_SELECT }>;

function mapCategory(row: CategoryRow): BudgetCategory {
  return {
    id: budgetCategoryId(row.id),
    organizationId: row.organizationId as OrganizationId,
    ...(row.parentId === null ? {} : { parentId: budgetCategoryId(row.parentId) }),
    name: row.name,
    ...(row.code === null ? {} : { code: row.code }),
    ...(row.description === null ? {} : { description: row.description }),
    isActive: row.isActive,
    outflowType: row.outflowType as BudgetCategoryOutflowType,
    ...(row.deletedAt === null ? {} : { deletedAt: row.deletedAt }),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaBudgetCategoryRepository implements BudgetCategoryRepository {
  constructor(private readonly client: PrismaClient | Prisma.TransactionClient) {}

  async listForOrganization(organizationId: OrganizationId): Promise<readonly BudgetCategory[]> {
    const rows = await this.client.budgetCategory.findMany({
      where: { organizationId, deletedAt: null },
      select: CATEGORY_SELECT,
      orderBy: { name: 'asc' },
    });
    return rows.map(mapCategory);
  }

  async findById(organizationId: OrganizationId, id: BudgetCategoryId): Promise<BudgetCategory | null> {
    const row = await this.client.budgetCategory.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: CATEGORY_SELECT,
    });
    return row === null ? null : mapCategory(row);
  }

  async create(input: CreateBudgetCategoryInput): Promise<BudgetCategory> {
    const row = await this.client.budgetCategory.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        ...(input.outflowType === undefined ? {} : { outflowType: input.outflowType }),
        ...(input.description === undefined ? {} : { description: input.description }),
        ...(input.code === undefined ? {} : { code: input.code }),
      },
      select: CATEGORY_SELECT,
    });
    return mapCategory(row);
  }

  async update(organizationId: OrganizationId, id: BudgetCategoryId, input: UpdateBudgetCategoryInput): Promise<BudgetCategory> {
    const existing = await this.findById(organizationId, id);
    if (existing === null) throw new NotFoundError('BudgetCategory', { budgetCategoryId: id, organizationId });

    const row = await this.client.budgetCategory.update({
      where: { id },
      data: {
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.outflowType === undefined ? {} : { outflowType: input.outflowType }),
        ...(input.description === undefined ? {} : { description: input.description }),
        ...(input.code === undefined ? {} : { code: input.code }),
        ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
      },
      select: CATEGORY_SELECT,
    });
    return mapCategory(row);
  }

  async softDelete(organizationId: OrganizationId, id: BudgetCategoryId): Promise<void> {
    await this.client.budgetCategory.update({
      where: { id, organizationId },
      data: { deletedAt: new Date() },
    });
  }
}
