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
import { validateExecutionRequestReadiness } from '@synaptria/domain/action-executions';
import type { ActionExecutionRequestRepository } from '@synaptria/domain/action-executions';
import { DomainEventService } from '@synaptria/events';

import { ApplicationError } from '../../shared/application-error';
import { loadAuthoritativeCurrentState } from '../action-proposals/resolve-action-proposal-validation';
import type { ActionProposalStateReaders } from '../action-proposals/state-readers/types';
import {
  createDefaultActionExecutionAccessPolicy,
  type ActionExecutionAccessPolicy,
} from './access-policy';
import type { ActionExecutionUnitOfWork } from './action-execution-unit-of-work';
import { SUPPORTED_EXECUTION_ACTION_TYPES } from './constants';
import type { ActionExecutionMutationContext } from './create-action-execution-request';
import type { ConfirmActionExecutionRequestResult } from './types';

export interface ConfirmActionExecutionRequestInput {
  readonly executionRequestId: string;
  readonly confirmIdempotencyKey?: string;
}

export interface ConfirmActionExecutionRequestDependencies {
  readonly actionExecutionRequestRepository: ActionExecutionRequestRepository;
  readonly actionExecutionUnitOfWork: ActionExecutionUnitOfWork;
  readonly stateReaders: ActionProposalStateReaders;
  readonly clock: Clock;
  readonly eventIdGenerator: IdGenerator;
  readonly accessPolicy?: ActionExecutionAccessPolicy;
}

export class ConfirmActionExecutionRequestUseCase {
  private readonly accessPolicy: ActionExecutionAccessPolicy;

  constructor(private readonly dependencies: ConfirmActionExecutionRequestDependencies) {
    this.accessPolicy =
      dependencies.accessPolicy ?? createDefaultActionExecutionAccessPolicy();
  }

  async execute(
    context: ActionExecutionMutationContext,
    input: ConfirmActionExecutionRequestInput,
  ): Promise<ConfirmActionExecutionRequestResult> {
    if (!this.accessPolicy.canConfirmExecutionRequest(context.role)) {
      throw new AuthorizationDeniedError('Action execution confirmation denied.');
    }

    const executionRequestId = input.executionRequestId.trim();
    if (executionRequestId.length === 0) {
      throw new ApplicationError({
        code: 'VALIDATION_FAILED',
        message: 'An execution request ID is required.',
        details: { field: 'executionRequestId' },
      });
    }

    const confirmIdempotencyKey =
      input.confirmIdempotencyKey === undefined
        ? undefined
        : input.confirmIdempotencyKey.trim();

    if (confirmIdempotencyKey !== undefined && confirmIdempotencyKey.length === 0) {
      throw new ApplicationError({
        code: 'VALIDATION_FAILED',
        message: 'Confirm idempotency key must not be blank when provided.',
        details: { field: 'confirmIdempotencyKey' },
      });
    }

    const existing = await this.loadRequest(context.organizationId, executionRequestId);
    if (existing === null) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Execution request was not found.',
        details: { executionRequestId },
      });
    }

    if (
      existing.status === 'CONFIRMED' &&
      (confirmIdempotencyKey === undefined ||
        existing.confirmIdempotencyKey === confirmIdempotencyKey)
    ) {
      return {
        request: existing,
        changed: false,
      };
    }

    if (existing.status === 'CONFIRMED') {
      throw new ApplicationError({
        code: 'CONFLICT',
        message: 'Execution request is already confirmed with a different idempotency key.',
        details: { executionRequestId },
      });
    }

    const readiness = await this.evaluateReadiness(context.organizationId, existing);
    if (readiness.status === 'STALE') {
      throw new ApplicationError({
        code: 'CONFLICT',
        message: 'Execution request preconditions are stale and cannot be confirmed.',
        details: { executionRequestId, issues: readiness.issues },
      });
    }

    if (readiness.status === 'UNSUPPORTED') {
      throw new ApplicationError({
        code: 'VALIDATION_FAILED',
        message: 'Execution request is unsupported.',
        details: { executionRequestId, issues: readiness.issues },
      });
    }

    const confirmedAt = this.dependencies.clock.now();

    return this.dependencies.actionExecutionUnitOfWork.execute(async (repositories) => {
      const current = await repositories.actionExecutionRequests.findById(
        context.organizationId,
        executionRequestId,
      );

      if (current === null) {
        throw new ApplicationError({
          code: 'NOT_FOUND',
          message: 'Execution request was not found.',
          details: { executionRequestId },
        });
      }

      if (current.status === 'CONFIRMED') {
        return {
          request: current,
          changed: false,
        };
      }

      const saved = await repositories.actionExecutionRequests.confirm({
        organizationId: context.organizationId,
        requestId: executionRequestId,
        confirmedByUserId: context.userId,
        confirmedAt,
        ...(confirmIdempotencyKey === undefined
          ? {}
          : { confirmIdempotencyKey }),
      });

      const audit = new AuditService(repositories.audit, this.dependencies.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: {
          type: 'USER',
          id: context.userId,
          userId: context.userId,
        },
        action: 'APPROVE',
        target: {
          entityType: 'ActionExecutionRequest',
          entityId: saved.id,
        },
        request: {
          requestId: context.requestId,
          correlationId: context.correlationId,
        },
        before: {
          status: current.status,
        },
        after: {
          status: saved.status,
          confirmedByUserId: context.userId,
          ...(saved.confirmedAt === undefined
            ? {}
            : { confirmedAt: saved.confirmedAt.toISOString() }),
        },
        metadata: {
          operation: 'action.execution.confirmed',
        },
        occurredAt: confirmedAt,
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
          type: 'action.execution.confirmed',
          aggregateType: 'ActionExecutionRequest',
          aggregateId: saved.id,
          payload: {
            executionRequestId: saved.id,
            actionProposalId: saved.snapshot.actionProposalId,
            recommendationId: saved.snapshot.recommendationId,
            actionType: saved.snapshot.actionType,
            status: saved.status,
            confirmedByUserId: context.userId,
          },
          occurredAt: confirmedAt,
          ...(confirmIdempotencyKey === undefined
            ? {}
            : { idempotencyKey: confirmIdempotencyKey }),
        },
      });

      return {
        request: saved,
        changed: true,
      };
    });
  }

  private async loadRequest(organizationId: OrganizationId, executionRequestId: string) {
    return this.dependencies.actionExecutionRequestRepository.findById(
      organizationId,
      executionRequestId,
    );
  }

  private async evaluateReadiness(
    organizationId: OrganizationId,
    request: ConfirmActionExecutionRequestResult['request'],
  ) {
    const currentState = await loadAuthoritativeCurrentState(
      {
        id: request.snapshot.actionProposalId,
        organizationId: request.organizationId,
        recommendationId: request.snapshot.recommendationId,
        recommendationType: '',
        actionType: request.snapshot.actionType,
        proposalKind: 'OPERATIONAL',
        target: request.snapshot.target,
        title: '',
        description: '',
        proposedChanges: request.snapshot.proposedChanges,
        preconditions: request.snapshot.preconditions,
        evidenceKeys: [],
        status: 'PROPOSED',
        createdAt: request.requestedAt,
      },
      organizationId,
      this.dependencies.stateReaders,
    );

    return validateExecutionRequestReadiness({
      request,
      organizationId,
      currentState,
      supportedActionTypes: SUPPORTED_EXECUTION_ACTION_TYPES,
    });
  }
}
