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
import type {
  UpdateVendorInput as RepositoryUpdateVendorInput,
  Vendor,
  VendorCategory,
  VendorStatus,
} from '@synaptria/domain/vendors';
import { DomainEventService } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';
import type { VendorUnitOfWork } from './vendor-unit-of-work';

export interface UpdateVendorContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface UpdateVendorInput {
  readonly vendorId: VendorId;
  readonly name?: string;
  readonly legalName?: string | null;
  readonly category?: VendorCategory;
  readonly status?: VendorStatus;
  readonly website?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly country?: string | null;
  readonly city?: string | null;
  readonly notes?: string | null;
}

export interface UpdateVendorOutput {
  readonly vendor: Vendor;
}

export class UpdateVendorUseCase {
  constructor(
    private readonly unitOfWork: VendorUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(context: UpdateVendorContext, input: UpdateVendorInput): Promise<UpdateVendorOutput> {
    requirePermission(context.role, PERMISSIONS.PROGRAMS_MANAGE);

    const repositoryInput: RepositoryUpdateVendorInput = {};

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (name.length === 0) {
        throw new ApplicationError({ code: 'VALIDATION_FAILED', message: 'name cannot be empty.', details: { field: 'name' } });
      }
      (repositoryInput as Record<string, unknown>).name = name;
    }

    if (input.legalName !== undefined) (repositoryInput as Record<string, unknown>).legalName = input.legalName;
    if (input.category !== undefined) (repositoryInput as Record<string, unknown>).category = input.category;
    if (input.status !== undefined) (repositoryInput as Record<string, unknown>).status = input.status;
    if (input.website !== undefined) (repositoryInput as Record<string, unknown>).website = input.website;
    if (input.email !== undefined) (repositoryInput as Record<string, unknown>).email = input.email;
    if (input.phone !== undefined) (repositoryInput as Record<string, unknown>).phone = input.phone;
    if (input.country !== undefined) (repositoryInput as Record<string, unknown>).country = input.country;
    if (input.city !== undefined) (repositoryInput as Record<string, unknown>).city = input.city;
    if (input.notes !== undefined) (repositoryInput as Record<string, unknown>).notes = input.notes;

    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const existing = await repositories.vendors.findById(context.organizationId, input.vendorId);
      if (existing === null || existing.deletedAt !== undefined) {
        throw new ApplicationError({ code: 'NOT_FOUND', message: 'Vendor not found.', details: { field: 'vendorId' } });
      }

      const vendor = await repositories.vendors.update(context.organizationId, input.vendorId, repositoryInput);

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: { type: 'USER', id: context.userId, userId: context.userId },
        action: 'UPDATE',
        target: { entityType: 'Vendor', entityId: vendor.id },
        request: { requestId: context.requestId, correlationId: context.correlationId },
        before: { id: existing.id, name: existing.name, status: existing.status },
        after: { id: vendor.id, name: vendor.name, status: vendor.status },
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
          type: 'vendor.updated',
          aggregateType: 'Vendor',
          aggregateId: vendor.id,
          payload: {
            vendorId: vendor.id,
            organizationId: context.organizationId,
            name: vendor.name,
            status: vendor.status,
            updatedByUserId: context.userId,
          },
          occurredAt,
        },
      });

      return { vendor };
    });
  }
}
