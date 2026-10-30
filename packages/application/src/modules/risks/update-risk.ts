import { AuditService } from '@synaptria/audit';
import {
  CryptoIdGenerator,
  SystemClock,
  type Clock,
  type CorrelationId,
  type IdGenerator,
  type MembershipId,
  type OrganizationId,
  type ProgramId,
  type ProjectId,
  type RequestId,
  type RiskId,
  type UserId,
} from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type {
  UpdateRiskInput as RepositoryUpdateRiskInput,
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

export interface UpdateRiskContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface UpdateRiskInput {
  readonly riskId: RiskId;
  readonly title?: string;
  readonly description?: string | null;
  readonly category?: RiskCategory;
  readonly status?: RiskStatus;
  readonly probability?: RiskProbability;
  readonly impact?: RiskImpact;
  readonly mitigationPlan?: string | null;
  readonly contingencyPlan?: string | null;
  readonly reviewDate?: Date | null;
  readonly programId?: ProgramId | null;
  readonly projectId?: ProjectId | null;
}

export interface UpdateRiskOutput {
  readonly risk: Risk;
}

export class UpdateRiskUseCase {
  constructor(
    private readonly unitOfWork: RiskUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(context: UpdateRiskContext, input: UpdateRiskInput): Promise<UpdateRiskOutput> {
    requirePermission(context.role, PERMISSIONS.PROGRAMS_MANAGE);

    const repositoryInput: RepositoryUpdateRiskInput = {};

    if (input.title !== undefined) {
      const title = input.title.trim();
      if (title.length === 0) {
        throw new ApplicationError({ code: 'VALIDATION_FAILED', message: 'title cannot be empty.', details: { field: 'title' } });
      }
      (repositoryInput as Record<string, unknown>).title = title;
    }

    if (input.description !== undefined) (repositoryInput as Record<string, unknown>).description = input.description;
    if (input.category !== undefined) (repositoryInput as Record<string, unknown>).category = input.category;
    if (input.status !== undefined) (repositoryInput as Record<string, unknown>).status = input.status;
    if (input.probability !== undefined) (repositoryInput as Record<string, unknown>).probability = input.probability;
    if (input.impact !== undefined) (repositoryInput as Record<string, unknown>).impact = input.impact;
    if (input.mitigationPlan !== undefined) (repositoryInput as Record<string, unknown>).mitigationPlan = input.mitigationPlan;
    if (input.contingencyPlan !== undefined) (repositoryInput as Record<string, unknown>).contingencyPlan = input.contingencyPlan;
    if (input.reviewDate !== undefined) (repositoryInput as Record<string, unknown>).reviewDate = input.reviewDate;
    if (input.programId !== undefined) (repositoryInput as Record<string, unknown>).programId = input.programId;
    if (input.projectId !== undefined) (repositoryInput as Record<string, unknown>).projectId = input.projectId;

    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const existing = await repositories.risks.findById(context.organizationId, input.riskId);
      if (existing === null || existing.deletedAt !== undefined) {
        throw new ApplicationError({ code: 'NOT_FOUND', message: 'Risk not found.', details: { field: 'riskId' } });
      }

      const risk = await repositories.risks.update(context.organizationId, input.riskId, repositoryInput);

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: { type: 'USER', id: context.userId, userId: context.userId },
        action: 'UPDATE',
        target: { entityType: 'Risk', entityId: risk.id },
        request: { requestId: context.requestId, correlationId: context.correlationId },
        before: { id: existing.id, title: existing.title, status: existing.status },
        after: { id: risk.id, title: risk.title, status: risk.status },
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
          type: 'risk.updated',
          aggregateType: 'Risk',
          aggregateId: risk.id,
          payload: {
            riskId: risk.id,
            organizationId: context.organizationId,
            title: risk.title,
            status: risk.status,
            updatedByUserId: context.userId,
          },
          occurredAt,
        },
      });

      return { risk };
    });
  }
}
