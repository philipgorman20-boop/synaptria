import { AuditService } from '@synaptria/audit';
import {
  CryptoIdGenerator,
  SystemClock,
  type Clock,
  type CorrelationId,
  type IdGenerator,
  type MembershipId,
  type MilestoneId,
  type OrganizationId,
  type ProgramId,
  type ProjectId,
  type RequestId,
  type UserId,
} from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type {
  CreateDecisionInput as RepositoryCreateDecisionInput,
  Decision,
  DecisionStatus,
} from '@synaptria/domain/decisions';
import { DomainEventService } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';
import type { DecisionUnitOfWork } from './decision-unit-of-work';

export interface CreateDecisionContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface CreateDecisionInput {
  readonly title: string;
  readonly context?: string;
  readonly decision?: string;
  readonly rationale?: string;
  readonly alternatives?: string;
  readonly status?: DecisionStatus;
  readonly decisionDate?: Date;
  readonly effectiveDate?: Date;
  readonly programId?: ProgramId;
  readonly projectId?: ProjectId;
  readonly milestoneId?: MilestoneId;
  readonly ownerId?: UserId;
}

export interface CreateDecisionOutput {
  readonly decision: Decision;
}

export class CreateDecisionUseCase {
  constructor(
    private readonly unitOfWork: DecisionUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(context: CreateDecisionContext, input: CreateDecisionInput): Promise<CreateDecisionOutput> {
    requirePermission(context.role, PERMISSIONS.PROGRAMS_MANAGE);

    const title = requireText(input.title, 'title');
    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const repositoryInput: RepositoryCreateDecisionInput = {
        organizationId: context.organizationId,
        title,
        createdById: context.userId,
        ...(input.status === undefined ? {} : { status: input.status }),
        ...(input.context === undefined ? {} : { context: input.context }),
        ...(input.decision === undefined ? {} : { decision: input.decision }),
        ...(input.rationale === undefined ? {} : { rationale: input.rationale }),
        ...(input.alternatives === undefined ? {} : { alternatives: input.alternatives }),
        ...(input.decisionDate === undefined ? {} : { decisionDate: input.decisionDate }),
        ...(input.effectiveDate === undefined ? {} : { effectiveDate: input.effectiveDate }),
        ...(input.programId === undefined ? {} : { programId: input.programId }),
        ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
        ...(input.milestoneId === undefined ? {} : { milestoneId: input.milestoneId }),
        ...(input.ownerId === undefined ? {} : { ownerId: input.ownerId }),
      };

      const decision = await repositories.decisions.create(repositoryInput);

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: { type: 'USER', id: context.userId, userId: context.userId },
        action: 'CREATE',
        target: { entityType: 'Decision', entityId: decision.id },
        request: { requestId: context.requestId, correlationId: context.correlationId },
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
          type: 'decision.created',
          aggregateType: 'Decision',
          aggregateId: decision.id,
          payload: {
            decisionId: decision.id,
            organizationId: context.organizationId,
            title: decision.title,
            status: decision.status,
            createdByUserId: context.userId,
          },
          occurredAt,
        },
      });

      return { decision };
    });
  }
}

function requireText(value: string, field: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new ApplicationError({ code: 'VALIDATION_FAILED', message: `${field} cannot be empty.`, details: { field } });
  }
  return normalized;
}
