import type { Clock, IdGenerator } from '@synaptria/core';
import type {
  CorrelationId,
  MembershipId,
  OrganizationId,
  RequestId,
  UserId,
} from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import { AuditService } from '@synaptria/audit';
import { computeActionExecutionSnapshotFingerprint } from './snapshot-fingerprint';
import { DomainEventService } from '@synaptria/events';

import { ApplicationError } from '../../shared/application-error';
import {
  buildActionProposalId,
  parseActionProposalRecommendationId,
} from '../action-proposals/build-action-proposal-id';
import {
  createDefaultActionExecutionAccessPolicy,
  type ActionExecutionAccessPolicy,
} from './access-policy';
import type { ActionExecutionUnitOfWork } from './action-execution-unit-of-work';
import { isSupportedExecutionActionType } from './constants';
import type { OperationalActionProposalReader } from './operational-action-proposal-reader';
import { buildExecutionRequestSnapshot, type CreateActionExecutionRequestResult } from './types';

export interface ActionExecutionMutationContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface CreateActionExecutionRequestInput {
  readonly recommendationId?: string;
  readonly actionProposalId?: string;
  readonly createIdempotencyKey: string;
}

export interface CreateActionExecutionRequestDependencies {
  readonly operationalActionProposalReader: OperationalActionProposalReader;
  readonly actionExecutionUnitOfWork: ActionExecutionUnitOfWork;
  readonly clock: Clock;
  readonly eventIdGenerator: IdGenerator;
  readonly accessPolicy?: ActionExecutionAccessPolicy;
}

export class CreateActionExecutionRequestUseCase {
  private readonly accessPolicy: ActionExecutionAccessPolicy;

  constructor(private readonly dependencies: CreateActionExecutionRequestDependencies) {
    this.accessPolicy =
      dependencies.accessPolicy ?? createDefaultActionExecutionAccessPolicy();
  }

  async execute(
    context: ActionExecutionMutationContext,
    input: CreateActionExecutionRequestInput,
  ): Promise<CreateActionExecutionRequestResult> {
    if (!this.accessPolicy.canCreateExecutionRequest(context.role)) {
      throw new AuthorizationDeniedError('Action execution request creation denied.');
    }

    const createIdempotencyKey = input.createIdempotencyKey.trim();
    if (createIdempotencyKey.length === 0) {
      throw new ApplicationError({
        code: 'VALIDATION_FAILED',
        message: 'A create idempotency key is required.',
        details: { field: 'createIdempotencyKey' },
      });
    }

    const recommendationId = this.resolveRecommendationId(input);
    const readContext = {
      organizationId: context.organizationId,
      role: context.role,
    };

    const loaded = await this.dependencies.operationalActionProposalReader.loadOperationalProposal(
      readContext,
      recommendationId,
    );

    if (loaded === null) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message:
          'Operational action proposal requires an accepted recommendation with a current operational mapping.',
        details: { recommendationId },
      });
    }

    const { proposal, validation } = loaded;

    if (proposal.proposalKind !== 'OPERATIONAL') {
      throw new ApplicationError({
        code: 'VALIDATION_FAILED',
        message: 'Only operational action proposals can create execution requests.',
        details: { recommendationId, proposalKind: proposal.proposalKind },
      });
    }

    if (validation.status !== 'CURRENT') {
      throw new ApplicationError({
        code: 'CONFLICT',
        message: 'Operational action proposal preconditions are stale.',
        details: { recommendationId, validationStatus: validation.status },
      });
    }

    if (!isSupportedExecutionActionType(proposal.actionType)) {
      throw new ApplicationError({
        code: 'VALIDATION_FAILED',
        message: 'Action type is not supported by the execution contract.',
        details: { actionType: proposal.actionType },
      });
    }

    if (proposal.organizationId !== context.organizationId) {
      throw new ApplicationError({
        code: 'VALIDATION_FAILED',
        message: 'Action proposal organization does not match trusted context.',
        details: { recommendationId },
      });
    }

    const requestedAt = this.dependencies.clock.now();
    const snapshot = buildExecutionRequestSnapshot(proposal);
    const snapshotFingerprint = computeActionExecutionSnapshotFingerprint(
      context.organizationId,
      snapshot,
    );

    return this.dependencies.actionExecutionUnitOfWork.execute(async (repositories) => {
      const existingByKey = await repositories.actionExecutionRequests.findByCreateIdempotencyKey(
        context.organizationId,
        createIdempotencyKey,
      );

      if (existingByKey !== null) {
        if (existingByKey.snapshotFingerprint !== snapshotFingerprint) {
          throw new ApplicationError({
            code: 'CONFLICT',
            message:
              'Create idempotency key was already used for a different execution authorization snapshot.',
            details: {
              createIdempotencyKey,
              existingRequestId: existingByKey.id,
              existingSnapshotFingerprint: existingByKey.snapshotFingerprint,
              snapshotFingerprint,
            },
          });
        }

        return {
          request: existingByKey,
          changed: false,
        };
      }

      const existingByFingerprint =
        await repositories.actionExecutionRequests.findBySnapshotFingerprint(
          context.organizationId,
          snapshotFingerprint,
        );

      if (existingByFingerprint !== null) {
        return {
          request: existingByFingerprint,
          changed: false,
        };
      }

      const saved = await repositories.actionExecutionRequests.create({
        organizationId: context.organizationId,
        snapshot,
        snapshotFingerprint,
        requestedByUserId: context.userId,
        requestedAt,
        createIdempotencyKey,
      });

      const audit = new AuditService(repositories.audit, this.dependencies.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: {
          type: 'USER',
          id: context.userId,
          userId: context.userId,
        },
        action: 'CREATE',
        target: {
          entityType: 'ActionExecutionRequest',
          entityId: saved.id,
        },
        request: {
          requestId: context.requestId,
          correlationId: context.correlationId,
        },
        before: null,
        after: {
          status: saved.status,
          actionProposalId: saved.snapshot.actionProposalId,
          recommendationId: saved.snapshot.recommendationId,
          actionType: saved.snapshot.actionType,
          snapshotFingerprint: saved.snapshotFingerprint,
        },
        metadata: {
          operation: 'action.execution.requested',
        },
        occurredAt: requestedAt,
      });

      const events = new DomainEventService(
        repositories.events,
        this.dependencies.clock,
        this.dependencies.eventIdGenerator,
      );

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
          type: 'action.execution.requested',
          aggregateType: 'ActionExecutionRequest',
          aggregateId: saved.id,
          payload: {
            executionRequestId: saved.id,
            actionProposalId: saved.snapshot.actionProposalId,
            recommendationId: saved.snapshot.recommendationId,
            actionType: saved.snapshot.actionType,
            status: saved.status,
            snapshotFingerprint: saved.snapshotFingerprint,
            requestedByUserId: context.userId,
          },
          occurredAt: requestedAt,
          idempotencyKey: createIdempotencyKey,
        },
      });

      return {
        request: saved,
        changed: true,
      };
    });
  }

  private resolveRecommendationId(input: CreateActionExecutionRequestInput): string {
    if (input.recommendationId !== undefined) {
      const recommendationId = input.recommendationId.trim();
      if (recommendationId.length === 0) {
        throw new ApplicationError({
          code: 'VALIDATION_FAILED',
          message: 'A recommendation ID is required.',
          details: { field: 'recommendationId' },
        });
      }

      return recommendationId;
    }

    if (input.actionProposalId !== undefined) {
      const actionProposalId = input.actionProposalId.trim();
      const recommendationId = parseActionProposalRecommendationId(actionProposalId);
      if (recommendationId === null) {
        throw new ApplicationError({
          code: 'VALIDATION_FAILED',
          message: 'A valid action proposal ID is required.',
          details: { field: 'actionProposalId' },
        });
      }

      if (actionProposalId !== buildActionProposalId(recommendationId)) {
        throw new ApplicationError({
          code: 'VALIDATION_FAILED',
          message: 'Action proposal ID format is invalid.',
          details: { field: 'actionProposalId' },
        });
      }

      return recommendationId;
    }

    throw new ApplicationError({
      code: 'VALIDATION_FAILED',
      message: 'A recommendation ID or action proposal ID is required.',
      details: { field: 'recommendationId' },
    });
  }
}
