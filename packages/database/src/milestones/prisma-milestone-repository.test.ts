import assert from 'node:assert/strict';
import test from 'node:test';

import {
  identifier,
  milestoneId,
  organizationId,
  projectId,
} from '@synaptria/core';
import { NotFoundError } from '@synaptria/core/errors';

import {
  PrismaMilestoneRepository,
  mapMilestone,
} from './prisma-milestone-repository';

const NOW = new Date('2026-07-22T12:00:00.000Z');
const ORGANIZATION_ID = organizationId('org-1');
const OTHER_ORGANIZATION_ID = organizationId('org-2');
const PROJECT_ID = projectId('project-1');
const OTHER_PROJECT_ID = projectId('project-2');
const MILESTONE_ID = milestoneId('milestone-1');

function milestoneRow(
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    id: 'milestone-1',
    organizationId: 'org-1',
    projectId: 'project-1',
    name: 'Phase 1 Gate',
    description: 'Initial review',
    status: 'PLANNED',
    priority: 'MEDIUM',
    plannedStartDate: null,
    plannedEndDate: null,
    actualStartDate: null,
    actualEndDate: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

test('PrismaMilestoneRepository creates a milestone scoped to the organization and project', async () => {
  let captured: Record<string, unknown> | undefined;
  const client = {
    milestone: {
      create: async (args: { data: Record<string, unknown>; select: unknown }) => {
        captured = args.data;
        return milestoneRow();
      },
    },
  };

  const repository = new PrismaMilestoneRepository(client as never);
  const milestone = await repository.create({
    organizationId: ORGANIZATION_ID,
    projectId: PROJECT_ID,
    name: 'Phase 1 Gate',
    description: 'Initial review',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    plannedStartDate: NOW,
    plannedEndDate: NOW,
  });

  assert.equal(captured?.organizationId, 'org-1');
  assert.equal(captured?.projectId, 'project-1');
  assert.equal(captured?.name, 'Phase 1 Gate');
  assert.equal(captured?.description, 'Initial review');
  assert.equal(captured?.status, 'IN_PROGRESS');
  assert.equal(captured?.priority, 'HIGH');
  assert.equal(captured?.plannedStartDate, NOW);
  assert.equal(captured?.plannedEndDate, NOW);
  assert.equal(milestone.id, MILESTONE_ID);
  assert.equal(milestone.organizationId, ORGANIZATION_ID);
  assert.equal(milestone.projectId, PROJECT_ID);
});

test('PrismaMilestoneRepository create does not apply repository-side business defaults', async () => {
  let captured: Record<string, unknown> | undefined;
  const client = {
    milestone: {
      create: async (args: { data: Record<string, unknown>; select: unknown }) => {
        captured = args.data;
        return milestoneRow();
      },
    },
  };

  const repository = new PrismaMilestoneRepository(client as never);
  await repository.create({
    organizationId: ORGANIZATION_ID,
    projectId: PROJECT_ID,
    name: 'Phase 1 Gate',
  });

  assert.equal(captured?.status, undefined);
  assert.equal(captured?.priority, undefined);
});

test('PrismaMilestoneRepository create persists application defaults when supplied', async () => {
  let captured: Record<string, unknown> | undefined;
  const client = {
    milestone: {
      create: async (args: { data: Record<string, unknown>; select: unknown }) => {
        captured = args.data;
        return milestoneRow({ status: 'PLANNED', priority: 'MEDIUM' });
      },
    },
  };

  const repository = new PrismaMilestoneRepository(client as never);
  const milestone = await repository.create({
    organizationId: ORGANIZATION_ID,
    projectId: PROJECT_ID,
    name: 'Phase 1 Gate',
    status: 'PLANNED',
    priority: 'MEDIUM',
  });

  assert.equal(captured?.status, 'PLANNED');
  assert.equal(captured?.priority, 'MEDIUM');
  assert.equal(milestone.status, 'PLANNED');
  assert.equal(milestone.priority, 'MEDIUM');
});

test('PrismaMilestoneRepository findById scopes by organizationId and excludes soft-deleted rows', async () => {
  let capturedWhere: Record<string, unknown> | undefined;
  const client = {
    milestone: {
      findFirst: async (args: { where: Record<string, unknown>; select: unknown }) => {
        capturedWhere = args.where;
        return milestoneRow();
      },
    },
  };

  const repository = new PrismaMilestoneRepository(client as never);
  const milestone = await repository.findById(ORGANIZATION_ID, MILESTONE_ID);

  assert.deepEqual(capturedWhere, {
    organizationId: ORGANIZATION_ID,
    deletedAt: null,
    id: MILESTONE_ID,
  });
  assert.equal(milestone?.name, 'Phase 1 Gate');
});

test('PrismaMilestoneRepository findById returns null for another organization', async () => {
  const client = {
    milestone: {
      findFirst: async () => null,
    },
  };

  const repository = new PrismaMilestoneRepository(client as never);
  const milestone = await repository.findById(OTHER_ORGANIZATION_ID, MILESTONE_ID);

  assert.equal(milestone, null);
});

test('PrismaMilestoneRepository findById excludes soft-deleted rows', async () => {
  const client = {
    milestone: {
      findFirst: async () => null,
    },
  };

  const repository = new PrismaMilestoneRepository(client as never);
  const milestone = await repository.findById(ORGANIZATION_ID, MILESTONE_ID);

  assert.equal(milestone, null);
});

test('PrismaMilestoneRepository update persists changes for active milestones', async () => {
  let capturedData: Record<string, unknown> | undefined;
  let capturedWhere: Record<string, unknown> | undefined;
  const client = {
    milestone: {
      findFirst: async () =>
        milestoneRow({
          name: 'Updated Gate',
          status: 'COMPLETED',
        }),
      updateMany: async (args: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => {
        capturedWhere = args.where;
        capturedData = args.data;
        return { count: 1 };
      },
    },
  };

  const repository = new PrismaMilestoneRepository(client as never);
  const milestone = await repository.update(ORGANIZATION_ID, MILESTONE_ID, {
    name: 'Updated Gate',
    status: 'COMPLETED',
  });

  assert.deepEqual(capturedWhere, {
    id: MILESTONE_ID,
    organizationId: ORGANIZATION_ID,
    deletedAt: null,
  });
  assert.equal(capturedData?.name, 'Updated Gate');
  assert.equal(capturedData?.status, 'COMPLETED');
  assert.equal(milestone.name, 'Updated Gate');
  assert.equal(milestone.status, 'COMPLETED');
});

test('PrismaMilestoneRepository update clears nullable fields when set to null', async () => {
  let capturedData: Record<string, unknown> | undefined;
  const client = {
    milestone: {
      findFirst: async () => milestoneRow({ description: null }),
      updateMany: async (args: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => {
        capturedData = args.data;
        return { count: 1 };
      },
    },
  };

  const repository = new PrismaMilestoneRepository(client as never);
  const milestone = await repository.update(ORGANIZATION_ID, MILESTONE_ID, {
    description: null,
    plannedEndDate: null,
  });

  assert.equal(capturedData?.description, null);
  assert.equal(capturedData?.plannedEndDate, null);
  assert.equal(milestone.description, undefined);
});

test('PrismaMilestoneRepository update throws not found when the milestone is outside the tenant', async () => {
  const client = {
    milestone: {
      findFirst: async () => null,
      updateMany: async () => {
        throw new Error('updateMany should not be called');
      },
    },
  };

  const repository = new PrismaMilestoneRepository(client as never);

  await assert.rejects(
    repository.update(ORGANIZATION_ID, MILESTONE_ID, { name: 'Updated Gate' }),
    NotFoundError,
  );
});

test('PrismaMilestoneRepository update throws not found for soft-deleted milestones', async () => {
  const client = {
    milestone: {
      findFirst: async () => null,
      updateMany: async () => {
        throw new Error('updateMany should not be called');
      },
    },
  };

  const repository = new PrismaMilestoneRepository(client as never);

  await assert.rejects(
    repository.update(ORGANIZATION_ID, MILESTONE_ID, { name: 'Updated Gate' }),
    NotFoundError,
  );
});

test('PrismaMilestoneRepository update throws not found when the milestone is soft-deleted after the existence check', async () => {
  const client = {
    milestone: {
      findFirst: async () => milestoneRow(),
      updateMany: async () => ({ count: 0 }),
    },
  };

  const repository = new PrismaMilestoneRepository(client as never);

  await assert.rejects(
    repository.update(ORGANIZATION_ID, MILESTONE_ID, { name: 'Updated Gate' }),
    NotFoundError,
  );
});

test('PrismaMilestoneRepository listForOrganization scopes reads to the active organization', async () => {
  let capturedWhere: Record<string, unknown> | undefined;
  const client = {
    milestone: {
      findMany: async (args: {
        where: Record<string, unknown>;
        select: unknown;
      }) => {
        capturedWhere = args.where;
        return [
          milestoneRow(),
          milestoneRow({ id: 'milestone-2', name: 'Beta Gate' }),
        ];
      },
    },
  };

  const repository = new PrismaMilestoneRepository(client as never);
  const milestones = await repository.listForOrganization(ORGANIZATION_ID);

  assert.deepEqual(capturedWhere, {
    organizationId: ORGANIZATION_ID,
    deletedAt: null,
  });
  assert.equal(milestones.length, 2);
  assert.equal(milestones[0]?.organizationId, ORGANIZATION_ID);
});

test('PrismaMilestoneRepository listForOrganization excludes soft-deleted rows', async () => {
  let capturedWhere: Record<string, unknown> | undefined;
  const client = {
    milestone: {
      findMany: async (args: {
        where: Record<string, unknown>;
        select: unknown;
      }) => {
        capturedWhere = args.where;
        return [];
      },
    },
  };

  const repository = new PrismaMilestoneRepository(client as never);
  await repository.listForOrganization(ORGANIZATION_ID);

  assert.equal(capturedWhere?.deletedAt, null);
});

test('PrismaMilestoneRepository listForProject scopes by organizationId and projectId', async () => {
  let capturedWhere: Record<string, unknown> | undefined;
  const client = {
    milestone: {
      findMany: async (args: {
        where: Record<string, unknown>;
        select: unknown;
      }) => {
        capturedWhere = args.where;
        return [milestoneRow()];
      },
    },
  };

  const repository = new PrismaMilestoneRepository(client as never);
  const milestones = await repository.listForProject(ORGANIZATION_ID, PROJECT_ID);

  assert.deepEqual(capturedWhere, {
    organizationId: ORGANIZATION_ID,
    deletedAt: null,
    projectId: PROJECT_ID,
  });
  assert.equal(milestones.length, 1);
  assert.equal(milestones[0]?.projectId, PROJECT_ID);
});

test('PrismaMilestoneRepository listForProject excludes soft-deleted rows', async () => {
  let capturedWhere: Record<string, unknown> | undefined;
  const client = {
    milestone: {
      findMany: async (args: {
        where: Record<string, unknown>;
        select: unknown;
      }) => {
        capturedWhere = args.where;
        return [];
      },
    },
  };

  const repository = new PrismaMilestoneRepository(client as never);
  await repository.listForProject(ORGANIZATION_ID, OTHER_PROJECT_ID);

  assert.equal(capturedWhere?.deletedAt, null);
  assert.equal(capturedWhere?.projectId, OTHER_PROJECT_ID);
});

test('mapMilestone converts nullable Prisma fields into optional domain properties', () => {
  const milestone = mapMilestone(
    milestoneRow({
      description: null,
      plannedStartDate: null,
      plannedEndDate: null,
      actualStartDate: null,
      actualEndDate: null,
    }) as never,
  );

  assert.equal(milestone.description, undefined);
  assert.equal(milestone.plannedStartDate, undefined);
  assert.equal(milestone.plannedEndDate, undefined);
  assert.equal(milestone.actualStartDate, undefined);
  assert.equal(milestone.actualEndDate, undefined);
  assert.equal(milestone.id, identifier('milestone-1', 'MilestoneId'));
  assert.equal(milestone.projectId, PROJECT_ID);
});
