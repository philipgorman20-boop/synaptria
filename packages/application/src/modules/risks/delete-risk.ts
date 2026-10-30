import { AuditService } from '@synaptria/audit';
import {
  CryptoIdGenerator,
  SystemClock,
  type Clock,
  type CorrelationId,
  type IdGenerator,
  type MembershipId,
  type OrganizationId,
  type RequestId,
  type RiskId,
  type UserId,
} from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import { DomainEventService } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';
import type { RiskUnitOfWork } from './risk-unit-of-work';

export interface DeleteRiskContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface DeleteRiskInput {
  readonly riskId: RiskId;
}

export interface DeleteRiskOutput {
  readonly riskId: RiskId;
}

export class DeleteRiskUseCase {
  constructor(
    private readonly unitOfWork: RiskUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(context: DeleteRiskContext, input: DeleteRiskInput): Promise<DeleteRiskOutput> {
    requirePermission(context.role, PERMISSIONS.PROGRAMS_MANAGE);

    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const existing = await repositories.risks.findById(context.organizationId, input.riskId);
      if (existing === null || existing.deletedAt !== undefined) {
        throw new ApplicationError({ code: 'NOT_FOUND', message: 'Risk not found.', details: { field: 'riskId' } });
      }

      const risk = await repositories.risks.softDelete(context.organizationId, input.riskId, occurredAt);

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: { type: 'USER', id: context.userId, userId: context.userId },
        action: 'DELETE',
        target: { entityType: 'Risk', entityId: risk.id },
        request: { requestId: context.requestId, correlationId: context.correlationId },
        before: { id: existing.id, title: existing.title, status: existing.status },
        after: null,
        occurredAt,
      });

      const events = new DomainEventService(repositories.events, this.clock, this.eventIdGenerator);
      await events.publish({
        context: {
          userId: context.userId,
          organizationId: context.organizationId,
          membershipId: context.membershipId,
          role: context.role,
          requestId: context.requestId,
          correlationId: context.correlationId,
        },
        event: {
          type: 'risk.deleted',
          aggregateType: 'Risk',
          aggregateId: risk.id,
          payload: {
            riskId: risk.id,
            organizationId: context.organizationId,
            deletedByUserId: context.userId,
          },
          occurredAt,
        },
      });

      return { riskId: risk.id };
    });
  }
}
