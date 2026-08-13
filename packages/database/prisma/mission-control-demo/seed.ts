import type { Prisma, PrismaClient } from '@prisma/client';

import {
  MISSION_CONTROL_DEMO_CODE_PREFIX,
  MISSION_CONTROL_DEMO_CORRELATION_ID,
  MISSION_CONTROL_DEMO_ORGANIZATION_SLUG,
  MISSION_CONTROL_DEMO_SEED_MARKER,
} from './constants';
import {
  normalizeSeedReferenceDate,
  resolveDemoDate,
  resolveRecentEventDate,
} from './dates';
import {
  buildMissionControlDemoScenario,
  summarizeMissionControlDemoScenario,
} from './scenario';

const INTERNAL_EVENT_METADATA_KEY = '__synaptriaEvent';

function assertDevelopmentOnlySeed(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Mission Control demo seed is development-only and cannot run in production.',
    );
  }

  if (process.env.ALLOW_MISSION_CONTROL_DEMO_SEED !== 'true') {
    const databaseUrl = process.env.DATABASE_URL ?? '';
    const looksLocal =
      databaseUrl.includes('localhost') ||
      databaseUrl.includes('127.0.0.1') ||
      databaseUrl.includes('0.0.0.0');

    if (!looksLocal && process.env.CI !== 'true') {
      throw new Error(
        'Mission Control demo seed blocked for non-local DATABASE_URL. Set ALLOW_MISSION_CONTROL_DEMO_SEED=true to override intentionally.',
      );
    }
  }
}

async function resolveDevelopmentOrganization(prisma: PrismaClient) {
  const organization = await prisma.organization.findFirst({
    where: {
      slug: MISSION_CONTROL_DEMO_ORGANIZATION_SLUG,
      deletedAt: null,
    },
  });

  if (organization === null) {
    throw new Error(
      `Organization "${MISSION_CONTROL_DEMO_ORGANIZATION_SLUG}" was not found. Run pnpm db:seed first.`,
    );
  }

  return organization;
}

async function cleanupMissionControlDemoData(
  prisma: PrismaClient,
  organizationId: string,
): Promise<void> {
  const demoProjects = await prisma.project.findMany({
    where: {
      organizationId,
      code: { startsWith: MISSION_CONTROL_DEMO_CODE_PREFIX },
    },
    select: { id: true },
  });
  const demoProjectIds = demoProjects.map((project) => project.id);

  const demoPrograms = await prisma.program.findMany({
    where: {
      organizationId,
      code: { startsWith: MISSION_CONTROL_DEMO_CODE_PREFIX },
    },
    select: { id: true },
  });
  const demoProgramIds = demoPrograms.map((program) => program.id);

  const demoMilestones =
    demoProjectIds.length === 0
      ? []
      : await prisma.milestone.findMany({
          where: { projectId: { in: demoProjectIds } },
          select: { id: true },
        });
  const demoMilestoneIds = demoMilestones.map((milestone) => milestone.id);

  const demoTasks =
    demoMilestoneIds.length === 0
      ? []
      : await prisma.task.findMany({
          where: { milestoneId: { in: demoMilestoneIds } },
          select: { id: true },
        });
  const demoTaskIds = demoTasks.map((task) => task.id);

  const demoAggregateIds = [
    ...demoProgramIds,
    ...demoProjectIds,
    ...demoMilestoneIds,
    ...demoTaskIds,
  ];

  await prisma.domainEvent.deleteMany({
    where: {
      organizationId,
      OR: [
        { correlationId: MISSION_CONTROL_DEMO_CORRELATION_ID },
        ...(demoAggregateIds.length === 0
          ? []
          : [{ aggregateId: { in: demoAggregateIds } }]),
      ],
    },
  });

  if (demoTaskIds.length > 0) {
    await prisma.task.deleteMany({
      where: { id: { in: demoTaskIds } },
    });
  }

  if (demoMilestoneIds.length > 0) {
    await prisma.milestone.deleteMany({
      where: { id: { in: demoMilestoneIds } },
    });
  }

  if (demoProjectIds.length > 0) {
    await prisma.project.deleteMany({
      where: { id: { in: demoProjectIds } },
    });
  }

  if (demoProgramIds.length > 0) {
    await prisma.program.deleteMany({
      where: { id: { in: demoProgramIds } },
    });
  }
}

function buildDemoEventCreateInput(input: {
  readonly id: string;
  readonly organizationId: string;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly eventType: string;
  readonly payload: Prisma.InputJsonValue;
  readonly occurredAt: Date;
}): Prisma.DomainEventUncheckedCreateInput {
  return {
    id: input.id,
    organizationId: input.organizationId,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    eventType: input.eventType,
    eventVersion: 1,
    payload: input.payload,
    metadata: {
      seed: MISSION_CONTROL_DEMO_SEED_MARKER,
      [INTERNAL_EVENT_METADATA_KEY]: {
        occurredAt: input.occurredAt.toISOString(),
        seed: MISSION_CONTROL_DEMO_SEED_MARKER,
      },
    },
    status: 'PUBLISHED',
    correlationId: MISSION_CONTROL_DEMO_CORRELATION_ID,
    availableAt: input.occurredAt,
    publishedAt: input.occurredAt,
    createdAt: input.occurredAt,
  };
}

export async function seedMissionControlDemo(prisma: PrismaClient): Promise<{
  readonly organizationSlug: string;
  readonly programsCreated: number;
  readonly projectsCreated: number;
  readonly milestonesCreated: number;
  readonly tasksCreated: number;
  readonly eventsCreated: number;
  readonly scenarioCategories: readonly string[];
}> {
  assertDevelopmentOnlySeed();

  const organization = await resolveDevelopmentOrganization(prisma);
  const referenceDate = normalizeSeedReferenceDate(new Date());
  const scenario = buildMissionControlDemoScenario();

  await cleanupMissionControlDemoData(prisma, organization.id);

  for (const program of scenario.programs) {
    await prisma.program.create({
      data: {
        id: program.id,
        organizationId: organization.id,
        code: program.code,
        name: program.name,
        description: 'Synthetic Mission Control demo program (development only).',
        status: program.status,
        priority: program.priority,
      },
    });
  }

  for (const project of scenario.projects) {
    await prisma.project.create({
      data: {
        id: project.id,
        organizationId: organization.id,
        programId: project.programId,
        code: project.code,
        name: project.name,
        description: 'Synthetic Mission Control demo project (development only).',
        status: project.status,
        priority: project.priority,
        percentComplete: project.percentComplete,
        ...(project.status === 'COMPLETED'
          ? {
              completedAt: resolveDemoDate(referenceDate, 'completed_past', 0),
            }
          : {}),
      },
    });
  }

  for (const milestone of scenario.milestones) {
    const plannedEndDate = resolveDemoDate(
      referenceDate,
      milestone.plannedEndKind,
      milestone.plannedEndSlot,
    );

    await prisma.milestone.create({
      data: {
        id: milestone.id,
        organizationId: organization.id,
        projectId: milestone.projectId,
        name: milestone.name,
        description: 'Synthetic Mission Control demo milestone (development only).',
        status: milestone.status,
        priority: milestone.priority,
        plannedEndDate,
        ...(milestone.status === 'COMPLETED'
          ? {
              actualEndDate: resolveDemoDate(referenceDate, 'completed_past', milestone.plannedEndSlot),
            }
          : {}),
      },
    });
  }

  for (const task of scenario.tasks) {
    await prisma.task.create({
      data: {
        id: task.id,
        organizationId: organization.id,
        milestoneId: task.milestoneId,
        name: task.name,
        description: 'Synthetic Mission Control demo task (development only).',
        status: task.status,
        priority: task.priority,
        ...(task.plannedEndKind === undefined || task.plannedEndSlot === undefined
          ? {}
          : {
              plannedEndDate: resolveDemoDate(
                referenceDate,
                task.plannedEndKind,
                task.plannedEndSlot,
              ),
            }),
        ...(task.status === 'COMPLETED'
          ? {
              actualEndDate: resolveDemoDate(
                referenceDate,
                'completed_past',
                task.plannedEndSlot ?? 0,
              ),
            }
          : {}),
      },
    });
  }

  for (const event of scenario.events) {
    const occurredAt = resolveRecentEventDate(referenceDate, event.recentIndex);
    await prisma.domainEvent.create({
      data: buildDemoEventCreateInput({
        id: event.id,
        organizationId: organization.id,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        eventType: event.eventType,
        payload: {
          seed: MISSION_CONTROL_DEMO_SEED_MARKER,
          aggregateType: event.aggregateType,
          aggregateId: event.aggregateId,
        },
        occurredAt,
      }),
    });
  }

  return {
    organizationSlug: organization.slug,
    programsCreated: scenario.programs.length,
    projectsCreated: scenario.projects.length,
    milestonesCreated: scenario.milestones.length,
    tasksCreated: scenario.tasks.length,
    eventsCreated: scenario.events.length,
    scenarioCategories: summarizeMissionControlDemoScenario(scenario),
  };
}

export async function countMissionControlDemoRecords(
  prisma: PrismaClient,
  organizationId: string,
): Promise<{
  readonly programs: number;
  readonly projects: number;
  readonly milestones: number;
  readonly tasks: number;
  readonly events: number;
}> {
  const [programs, projects, milestones, tasks, events] = await Promise.all([
    prisma.program.count({
      where: { organizationId, code: { startsWith: MISSION_CONTROL_DEMO_CODE_PREFIX } },
    }),
    prisma.project.count({
      where: { organizationId, code: { startsWith: MISSION_CONTROL_DEMO_CODE_PREFIX } },
    }),
    prisma.milestone.count({
      where: {
        organizationId,
        project: { code: { startsWith: MISSION_CONTROL_DEMO_CODE_PREFIX } },
      },
    }),
    prisma.task.count({
      where: {
        organizationId,
        milestone: {
          project: { code: { startsWith: MISSION_CONTROL_DEMO_CODE_PREFIX } },
        },
      },
    }),
    prisma.domainEvent.count({
      where: {
        organizationId,
        correlationId: MISSION_CONTROL_DEMO_CORRELATION_ID,
      },
    }),
  ]);

  return { programs, projects, milestones, tasks, events };
}
