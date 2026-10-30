import { AuditService } from '@synaptria/audit';
import {
  CryptoIdGenerator,
  SystemClock,
  type Clock,
  type CorrelationId,
  type DecisionId,
  type IdGenerator,
  type MembershipId,
  type OrganizationId,
  type ProgramId,
  type ProjectId,
  type RequestId,
  type UserId,
} from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type {
  Decision,
  DecisionStatus,
  UpdateDecisionInput as RepositoryUpdateDecisionInput,
} from '@synaptria/domain/decisions';
import { DomainEventService } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';
import type { DecisionUnitOfWork } from './decision-unit-of-work';

export interface UpdateDecisionContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface UpdateDecisionInput {
  readonly decisionId: DecisionId;
  readonly title?: string;
  readonly context?: string | null;
  readonly decision?: string | null;
  readonly rationale?: string | null;
  readonly alternatives?: string | null;
  readonly status?: DecisionStatus;
  readonly decisionDate?: Date | null;
  readonly effectiveDate?: Date | null;
  readonly programId?: ProgramId | null;
  readonly projectId?: ProjectId | null;
}

export interface UpdateDecisionOutput {
  readonly decision: Decision;
}

export class UpdateDecisionUseCase {
  constructor(
    private readonly unitOfWork: DecisionUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(context: UpdateDecisionContext, input: UpdateDecisionInput): Promise<UpdateDecisionOutput> {
    requirePermission(context.role, PERMISSIONS.PROGRAMS_MANAGE);

    const repositoryInput: RepositoryUpdateDecisionInput = {};

    if (input.title !== undefined) {
      const title = input.title.trim();
      if (title.length === 0) {
        throw new ApplicationError({ code: 'VALIDATION_FAILED', message: 'title cannot be empty.', details: { field: 'title' } });
      }
      (repositoryInput as Record<string, unknown>).title = title;
    }

    if (input.context !== undefined) (repositoryInput as Record<string, unknown>).context = input.context;
    if (input.decision !== undefined) (repositoryInput as Record<string, unknown>).decision = input.decision;
    if (input.rationale !== undefined) (repositoryInput as Record<string, unknown>).rationale = input.rationale;
    if (input.alternatives !== undefined) (repositoryInput as Record<string, unknown>).alternatives = input.alternatives;
    if (input.status !== undefined) (repositoryInput as Record<string, unknown>).status = input.status;
    if (input.decisionDate !== undefined) (repositoryInput as Record<string, unknown>).decisionDate = input.decisionDate;
    if (input.effectiveDate !== undefined) (repositoryInput as Record<string, unknown>).effectiveDate = input.effectiveDate;
    if (input.programId !== undefined) (repositoryInput as Record<string, unknown>).programId = input.programId;
    if (input.projectId !== undefined) (repositoryInput as Record<string, unknown>).projectId = input.projectId;

    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const existing = await repositories.decisions.findById(context.organizationId, input.decisionId);
      if (existing === null || existing.deletedAt !== undefined) {
        throw new ApplicationError({ code: 'NOT_FOUND', message: 'Decision not found.', details: { field: 'decisionId' } });
      }

      const decision = await repositories.decisions.update(context.organizationId, input.decisionId, repositoryInput);

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: { type: 'USER', id: context.userId, userId: context.userId },
        action: 'UPDATE',
        target: { entityType: 'Decision', entityId: decision.id },
        request: { requestId: context.requestId, correlationId: context.correlationId },
        before: { id: existing.id, title: existing.title, status: existing.status },
        after: { id: decision.id, title: decision.title, status: decision.status },
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
          type: 'decision.updated',
          aggregateType: 'Decision',
          aggregateId: decision.id,
          payload: {
            decisionId: decision.id,
            organizationId: context.organizationId,
            title: decision.title,
            status: decision.status,
            updatedByUserId: context.userId,
          },
          occurredAt,
        },
      });

      return { decision };
    });
  }
}
