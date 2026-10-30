import type { Prisma, PrismaClient } from '@prisma/client';
import { fundingEventId } from '@synaptria/core';
import type { FundingEventId, OrganizationId } from '@synaptria/core';
import type {
  CreateFundingEventInput,
  FundingEvent,
  FundingEventRepository,
  FundingEventStatus,
  FundingEventType,
  UpdateFundingEventInput,
} from '@synaptria/domain/budgets';

const FUNDING_EVENT_SELECT = {
  id: true,
  organizationId: true,
  name: true,
  type: true,
  status: true,
  amount: true,
  currency: true,
  receivedAt: true,
  expectedAt: true,
  investor: true,
  notes: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.FundingEventSelect;

type FundingEventRow = Prisma.FundingEventGetPayload<{ select: typeof FUNDING_EVENT_SELECT }>;

function mapFundingEvent(row: FundingEventRow): FundingEvent {
  return {
    id: fundingEventId(row.id),
    organizationId: row.organizationId as OrganizationId,
    name: row.name,
    type: row.type as FundingEventType,
    status: row.status as FundingEventStatus,
    amount: Number(row.amount),
    currency: row.currency,
    ...(row.receivedAt === null ? {} : { receivedAt: row.receivedAt }),
    ...(row.expectedAt === null ? {} : { expectedAt: row.expectedAt }),
    ...(row.investor === null ? {} : { investor: row.investor }),
    ...(row.notes === null ? {} : { notes: row.notes }),
    ...(row.deletedAt === null ? {} : { deletedAt: row.deletedAt }),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaFundingEventRepository implements FundingEventRepository {
  constructor(private readonly client: PrismaClient | Prisma.TransactionClient) {}

  async create(input: CreateFundingEventInput): Promise<FundingEvent> {
    const row = await this.client.fundingEvent.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        type: input.type,
        status: input.status ?? 'COMMITTED',
        amount: input.amount,
        currency: input.currency ?? 'USD',
        receivedAt: input.receivedAt ?? null,
        expectedAt: input.expectedAt ?? null,
        investor: input.investor ?? null,
        notes: input.notes ?? null,
      },
      select: FUNDING_EVENT_SELECT,
    });
    return mapFundingEvent(row);
  }

  async findById(organizationId: OrganizationId, id: FundingEventId): Promise<FundingEvent | null> {
    const row = await this.client.fundingEvent.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: FUNDING_EVENT_SELECT,
    });
    return row === null ? null : mapFundingEvent(row);
  }

  async update(organizationId: OrganizationId, id: FundingEventId, input: UpdateFundingEventInput): Promise<FundingEvent> {
    const row = await this.client.fundingEvent.update({
      where: { id, organizationId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.amount !== undefined ? { amount: input.amount } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.receivedAt !== undefined ? { receivedAt: input.receivedAt } : {}),
        ...(input.expectedAt !== undefined ? { expectedAt: input.expectedAt } : {}),
        ...(input.investor !== undefined ? { investor: input.investor } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
      select: FUNDING_EVENT_SELECT,
    });
    return mapFundingEvent(row);
  }

  async softDelete(organizationId: OrganizationId, id: FundingEventId): Promise<void> {
    await this.client.fundingEvent.update({
      where: { id, organizationId },
      data: { deletedAt: new Date() },
    });
  }

  async listForOrganization(organizationId: OrganizationId): Promise<readonly FundingEvent[]> {
    const rows = await this.client.fundingEvent.findMany({
      where: { organizationId, deletedAt: null },
      select: FUNDING_EVENT_SELECT,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapFundingEvent);
  }
}
