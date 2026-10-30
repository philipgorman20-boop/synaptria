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
  type UserId,
  type VendorId,
} from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import { DomainEventService } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';
import type { VendorUnitOfWork } from './vendor-unit-of-work';

export interface DeleteVendorContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface DeleteVendorInput {
  readonly vendorId: VendorId;
}

export interface DeleteVendorOutput {
  readonly vendorId: VendorId;
}

export class DeleteVendorUseCase {
  constructor(
    private readonly unitOfWork: VendorUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(context: DeleteVendorContext, input: DeleteVendorInput): Promise<DeleteVendorOutput> {
    requirePermission(context.role, PERMISSIONS.PROGRAMS_MANAGE);

    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const existing = await repositories.vendors.findById(context.organizationId, input.vendorId);
      if (existing === null || existing.deletedAt !== undefined) {
        throw new ApplicationError({ code: 'NOT_FOUND', message: 'Vendor not found.', details: { field: 'vendorId' } });
      }

      const vendor = await repositories.vendors.softDelete(context.organizationId, input.vendorId, occurredAt);

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: { type: 'USER', id: context.userId, userId: context.userId },
        action: 'DELETE',
        target: { entityType: 'Vendor', entityId: vendor.id },
        request: { requestId: context.requestId, correlationId: context.correlationId },
        before: { id: existing.id, name: existing.name, status: existing.status },
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
          type: 'vendor.deleted',
          aggregateType: 'Vendor',
          aggregateId: vendor.id,
          payload: {
            vendorId: vendor.id,
            organizationId: context.organizationId,
            deletedByUserId: context.userId,
          },
          occurredAt,
        },
      });

      return { vendorId: vendor.id };
    });
  }
}
