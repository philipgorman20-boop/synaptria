import assert from 'node:assert/strict';
import test from 'node:test';

import {
  correlationId,
  organizationId,
  requestId,
  success,
  userId,
} from '@synaptria/core';

import type {
  CreateOrganizationContext,
  CreateOrganizationInput,
  CreateOrganizationOutput,
  CreateOrganizationUseCase,
} from './create-organization';
import type {
  ListOrganizationsContext,
  ListOrganizationsOutput,
  ListOrganizationsUseCase,
} from './list-organizations';
import { OrganizationService } from './organization-service';
import type {
  SwitchOrganizationContext,
  SwitchOrganizationInput,
  SwitchOrganizationResult,
  SwitchOrganizationUseCase,
} from './switch-organization';

const USER_ID = userId('user-1');

class CreateOrganizationStub {
  received?: Readonly<{
    context: CreateOrganizationContext;
    input: CreateOrganizationInput;
  }>;

  constructor(private readonly output: CreateOrganizationOutput) {}

  async execute(
    context: CreateOrganizationContext,
    input: CreateOrganizationInput,
  ): Promise<CreateOrganizationOutput> {
    this.received = { context, input };
    return this.output;
  }
}

class ListOrganizationsStub {
  received?: ListOrganizationsContext;

  constructor(private readonly output: ListOrganizationsOutput) {}

  async execute(
    context: ListOrganizationsContext,
  ): Promise<ListOrganizationsOutput> {
    this.received = context;
    return this.output;
  }
}

class SwitchOrganizationStub {
  received?: Readonly<{
    context: SwitchOrganizationContext;
    input: SwitchOrganizationInput;
  }>;

  constructor(private readonly output: SwitchOrganizationResult) {}

  async execute(
    context: SwitchOrganizationContext,
    input: SwitchOrganizationInput,
  ): Promise<SwitchOrganizationResult> {
    this.received = { context, input };
    return this.output;
  }
}

test('organization service delegates to create, list, and switch use cases', async () => {
  const now = new Date('2026-07-22T18:00:00.000Z');
  const orgId = organizationId('org-1');
  const createOutput: CreateOrganizationOutput = {
    organization: {
      id: orgId,
      name: 'Synaptria Labs',
      slug: 'synaptria-labs',
      defaultCurrency: 'USD',
      fiscalYearStartMonth: 1,
      timezone: 'UTC',
      countryCode: 'US',
      createdAt: now,
      updatedAt: now,
    },
    membership: {
      id: 'membership-1' as CreateOrganizationOutput['membership']['id'],
      organizationId: orgId,
      userId: USER_ID,
      role: 'OWNER',
      status: 'ACTIVE',
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    },
  };
  const listOutput: ListOrganizationsOutput = {
    organizations: [{ ...createOutput, isActive: true }],
    activeOrganizationId: orgId,
  };
  const switchOutput = success({
    organization: createOutput.organization,
    membership: createOutput.membership,
    changed: false,
    previousOrganizationId: orgId,
  });

  const create = new CreateOrganizationStub(createOutput);
  const list = new ListOrganizationsStub(listOutput);
  const switchOrganization = new SwitchOrganizationStub(switchOutput);
  const service = new OrganizationService(
    create as unknown as CreateOrganizationUseCase,
    list as unknown as ListOrganizationsUseCase,
    switchOrganization as unknown as SwitchOrganizationUseCase,
  );

  const createContext = {
    userId: USER_ID,
    requestId: requestId('request-1'),
    correlationId: correlationId('correlation-1'),
  };
  const createInput = {
    name: 'Synaptria Labs',
    slug: 'synaptria-labs',
  };
  const listContext = {
    userId: USER_ID,
    activeOrganizationId: orgId,
  };
  const switchContext = {
    userId: USER_ID,
    requestId: requestId('request-switch-1'),
    correlationId: correlationId('correlation-switch-1'),
    currentOrganizationId: orgId,
  };
  const switchInput = { organizationId: orgId };

  assert.equal(
    await service.createOrganization(createContext, createInput),
    createOutput,
  );
  assert.equal(await service.listOrganizations(listContext), listOutput);
  assert.equal(
    await service.switchOrganization(switchContext, switchInput),
    switchOutput,
  );
  assert.deepEqual(create.received, {
    context: createContext,
    input: createInput,
  });
  assert.deepEqual(list.received, listContext);
  assert.deepEqual(switchOrganization.received, {
    context: switchContext,
    input: switchInput,
  });
});
