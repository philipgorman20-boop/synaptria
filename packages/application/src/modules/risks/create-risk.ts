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
  CreateRiskInput as RepositoryCreateRiskInput,
  Risk,
  RiskCategory,
  RiskImpact,
  RiskProbability,
  RiskStatus,
} from '@synaptria/domain/risks';
import { DomainEventService } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';
import type { RiskUnitOfWork } from './risk-unit-of-work';

export interface CreateRiskContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface CreateRiskInput {
  readonly title: string;
  readonly description?: string;
  readonly category: RiskCategory;
  readonly status?: RiskStatus;
  readonly probability?: RiskProbability;
  readonly impact?: RiskImpact;
  readonly mitigationPlan?: string;
  readonly contingencyPlan?: string;
  readonly reviewDate?: Date;
  readonly programId?: ProgramId;
  readonly projectId?: ProjectId;
  readonly milestoneId?: MilestoneId;
  readonly ownerId?: UserId;
}

export interface CreateRiskOutput {
  readonly risk: Risk;
}

export class CreateRiskUseCase {
  constructor(
    private readonly unitOfWork: RiskUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(context: CreateRiskContext, input: CreateRiskInput): Promise<CreateRiskOutput> {
    requirePermission(context.role, PERMISSIONS.PROGRAMS_MANAGE);

    const title = requireText(input.title, 'title');
    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const repositoryInput: RepositoryCreateRiskInput = {
        organizationId: context.organizationId,
        title,
        category: input.category,
        createdById: context.userId,
        ...(input.status === undefined ? {} : { status: input.status }),
        ...(input.probability === undefined ? {} : { probability: input.probability }),
        ...(input.impact === undefined ? {} : { impact: input.impact }),
        ...(input.description === undefined ? {} : { description: input.description }),
        ...(input.mitigationPlan === undefined ? {} : { mitigationPlan: input.mitigationPlan }),
        ...(input.contingencyPlan === undefined ? {} : { contingencyPlan: input.contingencyPlan }),
        ...(input.reviewDate === undefined ? {} : { reviewDate: input.reviewDate }),
        ...(input.programId === undefined ? {} : { programId: input.programId }),
        ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
        ...(input.milestoneId === undefined ? {} : { milestoneId: input.milestoneId }),
        ...(input.ownerId === undefined ? {} : { ownerId: input.ownerId }),
      };

      const risk = await repositories.risks.create(repositoryInput);

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: { type: 'USER', id: context.userId, userId: context.userId },
        action: 'CREATE',
        target: { entityType: 'Risk', entityId: risk.id },
        request: { requestId: context.requestId, correlationId: context.correlationId },
        after: { id: risk.id, title: risk.title, category: risk.category, status: risk.status },
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
          type: 'risk.created',
          aggregateType: 'Risk',
          aggregateId: risk.id,
          payload: {
            riskId: risk.id,
            organizationId: context.organizationId,
            title: risk.title,
            category: risk.category,
            status: risk.status,
            createdByUserId: context.userId,
          },
          occurredAt,
        },
      });

      return { risk };
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
