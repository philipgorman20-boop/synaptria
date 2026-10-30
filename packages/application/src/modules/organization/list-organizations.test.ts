import assert from 'node:assert/strict';
import test from 'node:test';

import {
  membershipId,
  organizationId,
  userId,
  type OrganizationId,
} from '@synaptria/core';
import type {
  CreateOrganizationInput,
  Organization,
  OrganizationRepository,
  OrganizationSummary,
  UpdateOrganizationInput,
} from '@synaptria/domain/organization';

import { ListOrganizationsUseCase } from './list-organizations';

const USER_ID = userId('user-1');
const ALPHA_ID = organizationId('org-alpha');
const BETA_ID = organizationId('org-beta');
const GAMMA_ID = organizationId('org-gamma');
const NOW = new Date('2026-07-22T16:00:00.000Z');

class InMemoryOrganizationRepository implements OrganizationRepository {
  constructor(
    readonly summaries: readonly OrganizationSummary[],
  ) {}

  async listForUser(): Promise<readonly OrganizationSummary[]> {
    return this.summaries;
  }

  async create(_input: CreateOrganizationInput): Promise<Organization> {
    throw new Error('Not implemented in this test.');
  }

  async findById(): Promise<Organization | null> {
    return null;
  }

  async findBySlug(): Promise<Organization | null> {
    return null;
  }

  async update(
    _id: OrganizationId,
    _input: UpdateOrganizationInput,
  ): Promise<Organization> {
    throw new Error('Not implemented in this test.');
  }

  async softDelete(): Promise<Organization> {
    throw new Error('Not implemented in this test.');
  }
}

test('lists accessible organizations alphabetically and marks the requested active organization', async () => {
  const repository = new InMemoryOrganizationRepository([
    summary(BETA_ID, 'Beta Bio', 'beta-bio'),
    summary(ALPHA_ID, 'Alpha Labs', 'alpha-labs'),
  ]);
  const useCase = new ListOrganizationsUseCase(repository);

  const output = await useCase.execute({
    userId: USER_ID,
    activeOrganizationId: BETA_ID,
  });

  assert.equal(output.activeOrganizationId, BETA_ID);
  assert.deepEqual(
    output.organizations.map((item) => item.organization.id),
    [ALPHA_ID, BETA_ID],
  );
  assert.deepEqual(
    output.organizations.map((item) => item.isActive),
    [false, true],
  );
});

test('falls back to the first accessible organization when the requested tenant is inaccessible', async () => {
  const repository = new InMemoryOrganizationRepository([
    summary(BETA_ID, 'Beta Bio', 'beta-bio'),
    summary(ALPHA_ID, 'Alpha Labs', 'alpha-labs'),
  ]);
  const useCase = new ListOrganizationsUseCase(repository);

  const output = await useCase.execute({
    userId: USER_ID,
    activeOrganizationId: organizationId('org-not-accessible'),
  });

  assert.equal(output.activeOrganizationId, ALPHA_ID);
  assert.equal(output.organizations[0]?.isActive, true);
});

test('returns an empty result when the user has no organizations', async () => {
  const useCase = new ListOrganizationsUseCase(
    new InMemoryOrganizationRepository([]),
  );

  const output = await useCase.execute({ userId: USER_ID });

  assert.deepEqual(output, { organizations: [] });
});

test('defensively excludes inactive memberships and deleted organizations', async () => {
  const deleted = summary(GAMMA_ID, 'Gamma Bio', 'gamma-bio', {
    deletedAt: NOW,
  });
  const suspended = summary(BETA_ID, 'Beta Bio', 'beta-bio', {
    membershipStatus: 'SUSPENDED',
  });
  const active = summary(ALPHA_ID, 'Alpha Labs', 'alpha-labs');
  const useCase = new ListOrganizationsUseCase(
    new InMemoryOrganizationRepository([deleted, suspended, active]),
  );

  const output = await useCase.execute({ userId: USER_ID });

  assert.equal(output.organizations.length, 1);
  assert.equal(output.organizations[0]?.organization.id, ALPHA_ID);
  assert.equal(output.activeOrganizationId, ALPHA_ID);
});

function summary(
  id: OrganizationId,
  name: string,
  slug: string,
  options: Readonly<{
    deletedAt?: Date;
    membershipStatus?: 'ACTIVE' | 'SUSPENDED';
  }> = {},
): OrganizationSummary {
  return {
    organization: {
      id,
      name,
      slug,
      defaultCurrency: 'USD',
      fiscalYearStartMonth: 1,
      timezone: 'UTC',
      countryCode: 'US',
      ...(options.deletedAt === undefined
        ? {}
        : { deletedAt: options.deletedAt }),
      createdAt: NOW,
      updatedAt: NOW,
    },
    membership: {
      id: membershipId(`membership-${id}`),
      organizationId: id,
      userId: USER_ID,
      role: 'OWNER',
      status: options.membershipStatus ?? 'ACTIVE',
      joinedAt: NOW,
      createdAt: NOW,
      updatedAt: NOW,
    },
  };
}
