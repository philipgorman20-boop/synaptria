import { AuditService } from '@synaptria/audit';
import {
  CryptoIdGenerator,
  SystemClock,
  failure,
  success,
  type Clock,
  type CorrelationId,
  type IdGenerator,
  type OrganizationId,
  type RequestId,
  type Result,
  type UserId,
} from '@synaptria/core';
import type {
  MembershipStatus,
  Organization,
  OrganizationMembership,
} from '@synaptria/domain/organization';
import { DomainEventService } from '@synaptria/events';

import type { OrganizationUnitOfWork } from './organization-unit-of-work';

export interface SwitchOrganizationContext {
  readonly userId: UserId;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
  readonly currentOrganizationId?: OrganizationId;
}

export interface SwitchOrganizationInput {
  readonly organizationId: OrganizationId;
}

export interface SwitchOrganizationOutput {
  readonly organization: Organization;
  readonly membership: OrganizationMembership;
  readonly changed: boolean;
  readonly previousOrganizationId?: OrganizationId;
}

export type SwitchOrganizationError =
  | Readonly<{
      code: 'ORGANIZATION_NOT_FOUND';
      message: string;
      organizationId: OrganizationId;
    }>
  | Readonly<{
      code: 'MEMBERSHIP_REQUIRED';
      message: string;
      organizationId: OrganizationId;
      userId: UserId;
    }>
  | Readonly<{
      code: 'MEMBERSHIP_INACTIVE';
      message: string;
      organizationId: OrganizationId;
      userId: UserId;
      status: MembershipStatus;
    }>;

export type SwitchOrganizationResult = Result<
  SwitchOrganizationOutput,
  SwitchOrganizationError
>;

/**
 * Validates and records an authenticated user's change of active tenant.
 *
 * Cookie persistence belongs to the web delivery layer. This use case returns
 * the validated organization and membership that the web layer may safely use
 * when updating the active-organization cookie.
 */
export class SwitchOrganizationUseCase {
  constructor(
    private readonly unitOfWork: OrganizationUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(
    context: SwitchOrganizationContext,
    input: SwitchOrganizationInput,
  ): Promise<SwitchOrganizationResult> {
    return this.unitOfWork.execute(async (repositories) => {
      const organization = await repositories.organizations.findById(
        input.organizationId,
      );

      if (organization === null) {
        return failure({
          code: 'ORGANIZATION_NOT_FOUND',
          message: 'The requested organization was not found.',
          organizationId: input.organizationId,
        });
      }

      const membership = await repositories.memberships.findForUser(
        organization.id,
        context.userId,
      );

      if (membership === null) {
        return failure({
          code: 'MEMBERSHIP_REQUIRED',
          message: 'An organization membership is required.',
          organizationId: organization.id,
          userId: context.userId,
        });
      }

      if (membership.status !== 'ACTIVE') {
        return failure({
          code: 'MEMBERSHIP_INACTIVE',
          message: 'The organization membership is not active.',
          organizationId: organization.id,
          userId: context.userId,
          status: membership.status,
        });
      }

      if (context.currentOrganizationId === organization.id) {
        return success({
          organization,
          membership,
          changed: false,
          previousOrganizationId: context.currentOrganizationId,
        });
      }

      const switchedAt = this.clock.now();
      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: organization.id,
        actor: {
          type: 'USER',
          id: context.userId,
          userId: context.userId,
        },
        action: 'CUSTOM',
        target: {
          entityType: 'OrganizationContext',
          entityId: organization.id,
        },
        request: {
          requestId: context.requestId,
          correlationId: context.correlationId,
        },
        before: {
          organizationId: context.currentOrganizationId ?? null,
        },
        after: {
          organizationId: organization.id,
          membershipId: membership.id,
          role: membership.role,
        },
        metadata: {
          operation: 'organization.switched',
        },
        occurredAt: switchedAt,
      });

      const events = new DomainEventService(
        repositories.events,
        this.clock,
        this.eventIdGenerator,
      );
      await events.publishSystem({
        organizationId: organization.id,
        actorId: context.userId,
        requestId: context.requestId,
        correlationId: context.correlationId,
        event: {
          type: 'organization.switched',
          aggregateType: 'Organization',
          aggregateId: organization.id,
          payload: {
            userId: context.userId,
            previousOrganizationId: context.currentOrganizationId ?? null,
            currentOrganizationId: organization.id,
            membershipId: membership.id,
            switchedAt: switchedAt.toISOString(),
          },
          occurredAt: switchedAt,
        },
      });

      return success({
        organization,
        membership,
        changed: true,
        ...(context.currentOrganizationId === undefined
          ? {}
          : { previousOrganizationId: context.currentOrganizationId }),
      });
    });
  }
}
