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
} from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type {
  CreateVendorInput as RepositoryCreateVendorInput,
  Vendor,
  VendorCategory,
  VendorStatus,
} from '@synaptria/domain/vendors';
import { DomainEventService } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';
import type { VendorUnitOfWork } from './vendor-unit-of-work';

export interface CreateVendorContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface CreateVendorInput {
  readonly name: string;
  readonly legalName?: string;
  readonly category: VendorCategory;
  readonly status?: VendorStatus;
  readonly website?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly addressLine1?: string;
  readonly addressLine2?: string;
  readonly city?: string;
  readonly stateProvince?: string;
  readonly postalCode?: string;
  readonly country?: string;
  readonly taxId?: string;
  readonly paymentTermsDays?: number;
  readonly notes?: string;
}

export interface CreateVendorOutput {
  readonly vendor: Vendor;
}

export class CreateVendorUseCase {
  constructor(
    private readonly unitOfWork: VendorUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(context: CreateVendorContext, input: CreateVendorInput): Promise<CreateVendorOutput> {
    requirePermission(context.role, PERMISSIONS.VENDORS_MANAGE);

    const name = requireText(input.name, 'name');
    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const repositoryInput: RepositoryCreateVendorInput = {
        organizationId: context.organizationId,
        name,
        category: input.category,
        ownerId: context.userId,
        ...(input.legalName === undefined ? {} : { legalName: input.legalName }),
        ...(input.status === undefined ? {} : { status: input.status }),
        ...(input.website === undefined ? {} : { website: input.website }),
        ...(input.email === undefined ? {} : { email: input.email }),
        ...(input.phone === undefined ? {} : { phone: input.phone }),
        ...(input.addressLine1 === undefined ? {} : { addressLine1: input.addressLine1 }),
        ...(input.addressLine2 === undefined ? {} : { addressLine2: input.addressLine2 }),
        ...(input.city === undefined ? {} : { city: input.city }),
        ...(input.stateProvince === undefined ? {} : { stateProvince: input.stateProvince }),
        ...(input.postalCode === undefined ? {} : { postalCode: input.postalCode }),
        ...(input.country === undefined ? {} : { country: input.country }),
        ...(input.taxId === undefined ? {} : { taxId: input.taxId }),
        ...(input.paymentTermsDays === undefined ? {} : { paymentTermsDays: input.paymentTermsDays }),
        ...(input.notes === undefined ? {} : { notes: input.notes }),
      };

      const vendor = await repositories.vendors.create(repositoryInput);

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: { type: 'USER', id: context.userId, userId: context.userId },
        action: 'CREATE',
        target: { entityType: 'Vendor', entityId: vendor.id },
        request: { requestId: context.requestId, correlationId: context.correlationId },
        after: { id: vendor.id, name: vendor.name, category: vendor.category, status: vendor.status },
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
          type: 'vendor.created',
          aggregateType: 'Vendor',
          aggregateId: vendor.id,
          payload: {
            vendorId: vendor.id,
            organizationId: context.organizationId,
            name: vendor.name,
            category: vendor.category,
            status: vendor.status,
            createdByUserId: context.userId,
          },
          occurredAt,
        },
      });

      return { vendor };
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
