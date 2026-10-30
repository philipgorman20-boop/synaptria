import type { Clock } from '@synaptria/core';
import { SystemClock } from '@synaptria/core';

import type { AuditRepository } from './repository';
import { toAuditJson, toAuditJsonObject } from './serialization';
import type { AuditEventRecord, RecordAuditEventInput, RecordUserAuditEventInput } from './types';

function requireText(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new TypeError(`${fieldName} cannot be empty.`);
  }
  return normalized;
}

export class AuditService {
  constructor(
    private readonly repository: AuditRepository,
    private readonly clock: Clock = new SystemClock(),
  ) {}

  async record(input: RecordAuditEventInput): Promise<AuditEventRecord> {
    return this.repository.create({
      ...input,
      target: {
        ...input.target,
        entityType: requireText(input.target.entityType, 'entityType'),
      },
      occurredAt: input.occurredAt ?? this.clock.now(),
    });
  }

  async recordUserEvent(input: RecordUserAuditEventInput): Promise<AuditEventRecord> {
    const { context } = input;

    return this.record({
      organizationId: context.organizationId,
      actor: {
        type: 'USER',
        id: context.userId,
        userId: context.userId,
      },
      action: input.action,
      target: input.target,
      request: {
        requestId: context.requestId,
        correlationId: context.correlationId,
        ...(input.ipAddress === undefined ? {} : { ipAddress: input.ipAddress }),
        ...(input.userAgent === undefined ? {} : { userAgent: input.userAgent }),
      },
      ...(input.before === undefined ? {} : { before: toAuditJson(input.before) }),
      ...(input.after === undefined ? {} : { after: toAuditJson(input.after) }),
      ...(input.metadata === undefined ? {} : { metadata: toAuditJsonObject(input.metadata) }),
      ...(input.occurredAt === undefined ? {} : { occurredAt: input.occurredAt }),
    });
  }
}
