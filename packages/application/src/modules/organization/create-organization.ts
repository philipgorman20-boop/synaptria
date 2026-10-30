import { AuditService } from '@synaptria/audit';
import {
  CryptoIdGenerator,
  SystemClock,
  type Clock,
  type CorrelationId,
  type IdGenerator,
  type RequestId,
  type UserId,
} from '@synaptria/core';
import type {
  Organization,
  OrganizationMembership,
  OrganizationSettings,
} from '@synaptria/domain/organization';
import { DomainEventService } from '@synaptria/events';

import { ApplicationError } from '../../shared/application-error';
import type { OrganizationUnitOfWork } from './organization-unit-of-work';

export interface CreateOrganizationContext {
  readonly userId: UserId;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface CreateOrganizationInput {
  readonly name: string;
  readonly slug: string;
  readonly legalName?: string;
  readonly defaultCurrency?: string;
  readonly fiscalYearStartMonth?: number;
  readonly timezone?: string;
  readonly countryCode?: string;
  readonly settings?: OrganizationSettings;
}

export interface CreateOrganizationOutput {
  readonly organization: Organization;
  readonly membership: OrganizationMembership;
}

export class CreateOrganizationUseCase {
  constructor(
    private readonly unitOfWork: OrganizationUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(
    context: CreateOrganizationContext,
    input: CreateOrganizationInput,
  ): Promise<CreateOrganizationOutput> {
    const normalized = normalizeInput(input);
    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const existing = await repositories.organizations.findBySlug(
        normalized.slug,
      );

      if (existing !== null) {
        throw new ApplicationError({
          code: 'CONFLICT',
          message: 'An organization with this slug already exists.',
          details: { slug: normalized.slug },
        });
      }

      const organization = await repositories.organizations.create(normalized);
      const membership = await repositories.memberships.add({
        organizationId: organization.id,
        userId: context.userId,
        role: 'OWNER',
        status: 'ACTIVE',
        joinedAt: occurredAt,
      });

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: organization.id,
        actor: {
          type: 'USER',
          id: context.userId,
          userId: context.userId,
        },
        action: 'CREATE',
        target: {
          entityType: 'Organization',
          entityId: organization.id,
        },
        request: {
          requestId: context.requestId,
          correlationId: context.correlationId,
        },
        after: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          ownerMembershipId: membership.id,
        },
        occurredAt,
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
          type: 'organization.created',
          aggregateType: 'Organization',
          aggregateId: organization.id,
          payload: {
            organizationId: organization.id,
            name: organization.name,
            slug: organization.slug,
            ownerUserId: context.userId,
            ownerMembershipId: membership.id,
          },
          occurredAt,
        },
      });

      return { organization, membership };
    });
  }
}

function normalizeInput(
  input: CreateOrganizationInput,
): CreateOrganizationInput {
  const name = requireText(input.name, 'name');
  const slug = normalizeSlug(input.slug);

  if (
    input.fiscalYearStartMonth !== undefined &&
    (!Number.isInteger(input.fiscalYearStartMonth) ||
      input.fiscalYearStartMonth < 1 ||
      input.fiscalYearStartMonth > 12)
  ) {
    throw validationError(
      'fiscalYearStartMonth must be an integer between 1 and 12.',
      'fiscalYearStartMonth',
    );
  }

  const defaultCurrency = input.defaultCurrency?.trim().toUpperCase();
  if (
    defaultCurrency !== undefined &&
    !/^[A-Z]{3}$/.test(defaultCurrency)
  ) {
    throw validationError(
      'defaultCurrency must be a three-letter currency code.',
      'defaultCurrency',
    );
  }

  const countryCode = input.countryCode?.trim().toUpperCase();
  if (countryCode !== undefined && !/^[A-Z]{2}$/.test(countryCode)) {
    throw validationError(
      'countryCode must be a two-letter country code.',
      'countryCode',
    );
  }

  return {
    name,
    slug,
    ...(input.legalName === undefined
      ? {}
      : { legalName: requireText(input.legalName, 'legalName') }),
    ...(defaultCurrency === undefined ? {} : { defaultCurrency }),
    ...(input.fiscalYearStartMonth === undefined
      ? {}
      : { fiscalYearStartMonth: input.fiscalYearStartMonth }),
    ...(input.timezone === undefined
      ? {}
      : { timezone: requireText(input.timezone, 'timezone') }),
    ...(countryCode === undefined ? {} : { countryCode }),
    ...(input.settings === undefined ? {} : { settings: input.settings }),
  };
}

function requireText(value: string, field: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw validationError(`${field} cannot be empty.`, field);
  }
  return normalized;
}

function normalizeSlug(value: string): string {
  const slug = value.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw validationError(
      'slug must contain lowercase letters, numbers, and single hyphens only.',
      'slug',
    );
  }
  return slug;
}

function validationError(message: string, field: string): ApplicationError {
  return new ApplicationError({
    code: 'VALIDATION_FAILED',
    message,
    details: { field },
  });
}
