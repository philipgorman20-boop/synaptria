import {
  Prisma,
  type ActionExecutionRequest as PrismaActionExecutionRequest,
  type PrismaClient,
} from '@prisma/client';
import { identifier, userId, type OrganizationId } from '@synaptria/core';
import type {
  ActionExecutionRequest,
  ActionExecutionRequestRepository,
  ActionExecutionRequestSnapshot,
  ActionExecutionRequestStatus,
  ConfirmActionExecutionRequestInput,
  CreateActionExecutionRequestInput,
} from '@synaptria/domain/action-executions';
import type { EntityType } from '@synaptria/domain/context';
import type {
  ActionProposalChange,
  ActionProposalPrecondition,
  ActionProposalScalarValue,
} from '@synaptria/domain/action-proposals';

export type ActionExecutionRequestDatabaseClient = Pick<
  PrismaClient,
  'actionExecutionRequest'
>;

const REQUEST_SELECT = {
  id: true,
  organizationId: true,
  actionProposalId: true,
  recommendationId: true,
  actionType: true,
  targetEntityType: true,
  targetEntityId: true,
  proposedChanges: true,
  preconditions: true,
  status: true,
  requestedByUserId: true,
  requestedAt: true,
  confirmedByUserId: true,
  confirmedAt: true,
  createIdempotencyKey: true,
  confirmIdempotencyKey: true,
  snapshotFingerprint: true,
} as const satisfies Prisma.ActionExecutionRequestSelect;

type SelectedRequest = Prisma.ActionExecutionRequestGetPayload<{
  select: typeof REQUEST_SELECT;
}>;

function isScalarValue(value: unknown): value is ActionProposalScalarValue {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

function parseChanges(value: unknown): readonly ActionProposalChange[] {
  if (!Array.isArray(value)) {
    throw new Error('Action execution request proposedChanges must be an array.');
  }

  return value.map((item, index) => {
    if (typeof item !== 'object' || item === null) {
      throw new Error(`Action execution request proposedChanges[${index}] must be an object.`);
    }

    const record = item as Record<string, unknown>;
    if (typeof record.field !== 'string') {
      throw new Error(`Action execution request proposedChanges[${index}].field must be a string.`);
    }

    if (!isScalarValue(record.currentValue) || !isScalarValue(record.proposedValue)) {
      throw new Error(
        `Action execution request proposedChanges[${index}] must use bounded scalar values.`,
      );
    }

    return {
      field: record.field,
      currentValue: record.currentValue,
      proposedValue: record.proposedValue,
    };
  });
}

function parsePreconditions(value: unknown): readonly ActionProposalPrecondition[] {
  if (!Array.isArray(value)) {
    throw new Error('Action execution request preconditions must be an array.');
  }

  return value.map((item, index) => {
    if (typeof item !== 'object' || item === null) {
      throw new Error(`Action execution request preconditions[${index}] must be an object.`);
    }

    const record = item as Record<string, unknown>;
    if (typeof record.field !== 'string') {
      throw new Error(`Action execution request preconditions[${index}].field must be a string.`);
    }

    if (!isScalarValue(record.expectedValue)) {
      throw new Error(
        `Action execution request preconditions[${index}] must use bounded scalar expectedValue.`,
      );
    }

    return {
      field: record.field,
      expectedValue: record.expectedValue,
    };
  });
}

function mapStatus(
  status: PrismaActionExecutionRequest['status'],
): ActionExecutionRequestStatus {
  return status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING_CONFIRMATION';
}

function toPrismaStatus(status: ActionExecutionRequestStatus): PrismaActionExecutionRequest['status'] {
  return status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING_CONFIRMATION';
}

function toSnapshot(row: SelectedRequest): ActionExecutionRequestSnapshot {
  return {
    actionProposalId: row.actionProposalId,
    recommendationId: row.recommendationId,
    actionType: row.actionType,
    target: {
      entityType: row.targetEntityType as EntityType,
      entityId: row.targetEntityId,
    },
    proposedChanges: parseChanges(row.proposedChanges),
    preconditions: parsePreconditions(row.preconditions),
  };
}

function mapRequest(row: SelectedRequest): ActionExecutionRequest {
  return {
    id: row.id,
    organizationId: identifier(row.organizationId, 'OrganizationId'),
    snapshot: toSnapshot(row),
    requestedByUserId: userId(row.requestedByUserId),
    requestedAt: row.requestedAt,
    status: mapStatus(row.status),
    createIdempotencyKey: row.createIdempotencyKey,
    snapshotFingerprint: row.snapshotFingerprint,
    ...(row.confirmedByUserId === null || row.confirmedByUserId === undefined
      ? {}
      : { confirmedByUserId: userId(row.confirmedByUserId) }),
    ...(row.confirmedAt === null || row.confirmedAt === undefined
      ? {}
      : { confirmedAt: row.confirmedAt }),
    ...(row.confirmIdempotencyKey === null || row.confirmIdempotencyKey === undefined
      ? {}
      : { confirmIdempotencyKey: row.confirmIdempotencyKey }),
  };
}

function serializeChanges(
  changes: readonly ActionProposalChange[],
): Prisma.InputJsonValue {
  return changes.map((change) => ({
    field: change.field,
    currentValue: change.currentValue,
    proposedValue: change.proposedValue,
  }));
}

function serializePreconditions(
  preconditions: readonly ActionProposalPrecondition[],
): Prisma.InputJsonValue {
  return preconditions.map((precondition) => ({
    field: precondition.field,
    expectedValue: precondition.expectedValue,
  }));
}

export class PrismaActionExecutionRequestRepository
  implements ActionExecutionRequestRepository
{
  constructor(private readonly client: ActionExecutionRequestDatabaseClient) {}

  async create(input: CreateActionExecutionRequestInput): Promise<ActionExecutionRequest> {
    const row = await this.client.actionExecutionRequest.create({
      data: {
        organizationId: input.organizationId,
        actionProposalId: input.snapshot.actionProposalId,
        recommendationId: input.snapshot.recommendationId,
        actionType: input.snapshot.actionType,
        targetEntityType: input.snapshot.target.entityType,
        targetEntityId: input.snapshot.target.entityId,
        proposedChanges: serializeChanges(input.snapshot.proposedChanges),
        preconditions: serializePreconditions(input.snapshot.preconditions),
        status: 'PENDING_CONFIRMATION',
        requestedByUserId: input.requestedByUserId,
        requestedAt: input.requestedAt,
        createIdempotencyKey: input.createIdempotencyKey,
        snapshotFingerprint: input.snapshotFingerprint,
      },
      select: REQUEST_SELECT,
    });

    return mapRequest(row);
  }

  async findById(
    organizationId: OrganizationId,
    requestId: string,
  ): Promise<ActionExecutionRequest | null> {
    const row = await this.client.actionExecutionRequest.findFirst({
      where: {
        id: requestId,
        organizationId,
      },
      select: REQUEST_SELECT,
    });

    return row === null ? null : mapRequest(row);
  }

  async findByCreateIdempotencyKey(
    organizationId: OrganizationId,
    createIdempotencyKey: string,
  ): Promise<ActionExecutionRequest | null> {
    const row = await this.client.actionExecutionRequest.findUnique({
      where: {
        organizationId_createIdempotencyKey: {
          organizationId,
          createIdempotencyKey,
        },
      },
      select: REQUEST_SELECT,
    });

    return row === null ? null : mapRequest(row);
  }

  async findBySnapshotFingerprint(
    organizationId: OrganizationId,
    snapshotFingerprint: string,
  ): Promise<ActionExecutionRequest | null> {
    const row = await this.client.actionExecutionRequest.findUnique({
      where: {
        organizationId_snapshotFingerprint: {
          organizationId,
          snapshotFingerprint,
        },
      },
      select: REQUEST_SELECT,
    });

    return row === null ? null : mapRequest(row);
  }

  async confirm(input: ConfirmActionExecutionRequestInput): Promise<ActionExecutionRequest> {
    const row = await this.client.actionExecutionRequest.update({
      where: {
        id: input.requestId,
        organizationId: input.organizationId,
      },
      data: {
        status: 'CONFIRMED',
        confirmedByUserId: input.confirmedByUserId,
        confirmedAt: input.confirmedAt,
        ...(input.confirmIdempotencyKey === undefined
          ? {}
          : { confirmIdempotencyKey: input.confirmIdempotencyKey }),
      },
      select: REQUEST_SELECT,
    });

    return mapRequest(row);
  }
}
