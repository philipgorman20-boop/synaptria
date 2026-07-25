import type {
  AuditEvent as PrismaAuditEvent,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import type {
  AuditActor,
  AuditEventRecord,
  AuditRepository,
  AuditRequestDetails,
  AuditTarget,
  JsonObject,
  JsonValue,
  RecordAuditEventInput,
} from '@synaptria/audit';
import {
  identifier,
  type CorrelationId,
  type OrganizationId,
  type RequestId,
  type UserId,
} from '@synaptria/core';

import { toPrismaJson } from '../json';

export type AuditDatabaseClient = Pick<PrismaClient, 'auditEvent'>;

export class PrismaAuditRepository implements AuditRepository {
  constructor(private readonly client: AuditDatabaseClient) {}

  async create(input: RecordAuditEventInput): Promise<AuditEventRecord> {
    const data: Prisma.AuditEventUncheckedCreateInput = {
      organizationId: input.organizationId,
      userId: input.actor.userId ?? null,
      actorType: input.actor.type,
      actorId: input.actor.id ?? null,
      action: input.action,
      entityType: input.target.entityType,
      entityId: input.target.entityId ?? null,
      programId: input.target.programId ?? null,
      requestId: input.request?.requestId ?? null,
      correlationId: input.request?.correlationId ?? null,
      ipAddress: input.request?.ipAddress ?? null,
      userAgent: input.request?.userAgent ?? null,
      ...(input.before === undefined
        ? {}
        : { before: toPrismaJson(input.before) }),
      ...(input.after === undefined
        ? {}
        : { after: toPrismaJson(input.after) }),
      ...(input.metadata === undefined
        ? {}
        : { metadata: toPrismaJson(input.metadata) }),
      ...(input.occurredAt === undefined
        ? {}
        : { occurredAt: input.occurredAt }),
    };

    const row = await this.client.auditEvent.create({ data });

    return mapAuditEvent(row);
  }
}

function mapAuditEvent(row: PrismaAuditEvent): AuditEventRecord {
  const actor: AuditActor = {
    type: row.actorType,
    ...(row.actorId === null ? {} : { id: row.actorId }),
    ...(row.userId === null
      ? {}
      : {
          userId: identifier(row.userId, 'UserId') as UserId,
        }),
  };

  const target: AuditTarget = {
    entityType: row.entityType,
    ...(row.entityId === null ? {} : { entityId: row.entityId }),
    ...(row.programId === null ? {} : { programId: row.programId }),
  };

  const request = mapRequestDetails(row);

  return {
    id: row.id,
    organizationId: identifier(
      row.organizationId,
      'OrganizationId',
    ) as OrganizationId,
    actor,
    action: row.action,
    target,
    ...(request === undefined ? {} : { request }),
    ...(row.before === null
      ? {}
      : { before: row.before as JsonValue }),
    ...(row.after === null
      ? {}
      : { after: row.after as JsonValue }),
    ...(row.metadata === null
      ? {}
      : { metadata: row.metadata as JsonObject }),
    occurredAt: row.occurredAt,
  };
}

function mapRequestDetails(
  row: PrismaAuditEvent,
): AuditRequestDetails | undefined {
  if (
    row.requestId === null &&
    row.correlationId === null &&
    row.ipAddress === null &&
    row.userAgent === null
  ) {
    return undefined;
  }

  return {
    ...(row.requestId === null
      ? {}
      : {
          requestId: identifier(
            row.requestId,
            'RequestId',
          ) as RequestId,
        }),
    ...(row.correlationId === null
      ? {}
      : {
          correlationId: identifier(
            row.correlationId,
            'CorrelationId',
          ) as CorrelationId,
        }),
    ...(row.ipAddress === null
      ? {}
      : { ipAddress: row.ipAddress }),
    ...(row.userAgent === null
      ? {}
      : { userAgent: row.userAgent }),
  };
}
