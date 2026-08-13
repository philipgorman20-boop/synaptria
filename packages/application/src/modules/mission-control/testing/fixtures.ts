import {
  correlationId,
  membershipId,
  milestoneId,
  organizationId,
  projectId,
  programId,
  requestId,
  taskId,
  userId,
  type MilestoneId,
  type OrganizationId,
  type ProgramId,
  type ProjectId,
  type TaskId,
} from '@synaptria/core';
import type { Milestone, MilestoneRepository } from '@synaptria/domain/milestones';
import type { Program, ProgramRepository } from '@synaptria/domain/programs';
import type { Project, ProjectRepository } from '@synaptria/domain/projects';
import type { Task, TaskRepository } from '@synaptria/domain/tasks';
import type {
  DomainEventEnvelope,
  DomainEventId,
  EventRepository,
  OrganizationRecentEventsQuery,
} from '@synaptria/events';
import { filterRecentOrganizationEvents } from '@synaptria/events';

export const NOW = new Date('2026-07-26T12:00:00.000Z');
export const ORGANIZATION_ID = organizationId('org-1');
export const OTHER_ORGANIZATION_ID = organizationId('org-2');
export const PROGRAM_ID = programId('program-1');
export const PROJECT_ID = projectId('project-1');
export const PROJECT_B_ID = projectId('project-2');
export const MILESTONE_ID = milestoneId('milestone-1');
export const MILESTONE_B_ID = milestoneId('milestone-2');
export const TASK_ID = taskId('task-1');
export const TASK_B_ID = taskId('task-2');

export function programFixture(overrides: Partial<Program> = {}): Program {
  return {
    id: PROGRAM_ID,
    organizationId: ORGANIZATION_ID,
    name: 'Oncology Program',
    status: 'CLINICAL',
    priority: 'HIGH',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function projectFixture(overrides: Partial<Project> = {}): Project {
  return {
    id: PROJECT_ID,
    organizationId: ORGANIZATION_ID,
    programId: PROGRAM_ID,
    name: 'Alpha Study',
    status: 'ACTIVE',
    priority: 'MEDIUM',
    percentComplete: 25,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function milestoneFixture(overrides: Partial<Milestone> = {}): Milestone {
  return {
    id: MILESTONE_ID,
    organizationId: ORGANIZATION_ID,
    projectId: PROJECT_ID,
    name: 'Protocol Draft',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function taskFixture(overrides: Partial<Task> = {}): Task {
  return {
    id: TASK_ID,
    organizationId: ORGANIZATION_ID,
    milestoneId: MILESTONE_ID,
    name: 'Prepare reagents',
    status: 'TODO',
    priority: 'MEDIUM',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export class InMemoryProgramRepository implements ProgramRepository {
  constructor(private readonly programs: readonly Program[] = []) {}

  async findById(organizationId: OrganizationId, id: ProgramId): Promise<Program | null> {
    return (
      this.programs.find(
        (program) =>
          program.organizationId === organizationId &&
          program.id === id &&
          program.deletedAt === undefined,
      ) ?? null
    );
  }

  async create(): Promise<Program> {
    throw new Error('Not implemented.');
  }

  async findByName(): Promise<Program | null> {
    return null;
  }

  async findByCode(): Promise<Program | null> {
    return null;
  }

  async listForOrganization(organizationId: OrganizationId): Promise<readonly Program[]> {
    return this.programs.filter(
      (program) =>
        program.organizationId === organizationId && program.deletedAt === undefined,
    );
  }

  async update(): Promise<Program> {
    throw new Error('Not implemented.');
  }

  async softDelete(): Promise<Program> {
    throw new Error('Not implemented.');
  }
}

export class InMemoryProjectRepository implements ProjectRepository {
  constructor(private readonly projects: readonly Project[] = []) {}

  async findById(organizationId: OrganizationId, id: ProjectId): Promise<Project | null> {
    return (
      this.projects.find(
        (project) =>
          project.organizationId === organizationId &&
          project.id === id &&
          project.deletedAt === undefined,
      ) ?? null
    );
  }

  async create(): Promise<Project> {
    throw new Error('Not implemented.');
  }

  async findByName(): Promise<Project | null> {
    return null;
  }

  async findByCode(): Promise<Project | null> {
    return null;
  }

  async listForOrganization(organizationId: OrganizationId): Promise<readonly Project[]> {
    return this.projects.filter(
      (project) =>
        project.organizationId === organizationId && project.deletedAt === undefined,
    );
  }

  async listForProgram(): Promise<readonly Project[]> {
    return [];
  }

  async update(): Promise<Project> {
    throw new Error('Not implemented.');
  }

  async softDelete(): Promise<Project> {
    throw new Error('Not implemented.');
  }
}

export class InMemoryMilestoneRepository implements MilestoneRepository {
  constructor(private readonly milestones: readonly Milestone[] = []) {}

  async findById(organizationId: OrganizationId, id: MilestoneId): Promise<Milestone | null> {
    return (
      this.milestones.find(
        (milestone) => milestone.organizationId === organizationId && milestone.id === id,
      ) ?? null
    );
  }

  async create(): Promise<Milestone> {
    throw new Error('Not implemented.');
  }

  async listForOrganization(organizationId: OrganizationId): Promise<readonly Milestone[]> {
    return this.milestones.filter(
      (milestone) => milestone.organizationId === organizationId,
    );
  }

  async listForProject(
    organizationId: OrganizationId,
    projectIdValue: ProjectId,
  ): Promise<readonly Milestone[]> {
    return this.milestones.filter(
      (milestone) =>
        milestone.organizationId === organizationId &&
        milestone.projectId === projectIdValue,
    );
  }

  async update(): Promise<Milestone> {
    throw new Error('Not implemented.');
  }
}

export class InMemoryTaskRepository implements TaskRepository {
  constructor(private readonly tasks: readonly Task[] = []) {}

  async findById(organizationId: OrganizationId, id: TaskId): Promise<Task | null> {
    return (
      this.tasks.find((task) => task.organizationId === organizationId && task.id === id) ??
      null
    );
  }

  async create(): Promise<Task> {
    throw new Error('Not implemented.');
  }

  async listForOrganization(organizationId: OrganizationId): Promise<readonly Task[]> {
    return this.tasks.filter((task) => task.organizationId === organizationId);
  }

  async listForMilestone(
    organizationId: OrganizationId,
    milestoneIdValue: MilestoneId,
  ): Promise<readonly Task[]> {
    return this.tasks.filter(
      (task) =>
        task.organizationId === organizationId && task.milestoneId === milestoneIdValue,
    );
  }

  async update(): Promise<Task> {
    throw new Error('Not implemented.');
  }
}

export class InMemoryEventRepository implements EventRepository {
  readonly listRecentQueries: OrganizationRecentEventsQuery[] = [];

  constructor(private readonly events: readonly DomainEventEnvelope[] = []) {}

  async append(event: DomainEventEnvelope): Promise<DomainEventEnvelope> {
    return event;
  }

  async appendMany(events: readonly DomainEventEnvelope[]): Promise<readonly DomainEventEnvelope[]> {
    return events;
  }

  async findById(): Promise<DomainEventEnvelope | null> {
    return null;
  }

  async findByAggregate(): Promise<readonly DomainEventEnvelope[]> {
    return [];
  }

  async listRecentForOrganization(
    query: OrganizationRecentEventsQuery,
  ): Promise<readonly DomainEventEnvelope[]> {
    this.listRecentQueries.push({ ...query });
    return filterRecentOrganizationEvents(this.events, query);
  }

  async updateStatus(): Promise<DomainEventEnvelope> {
    throw new Error('Not implemented.');
  }
}

export function domainEventFixture(
  overrides: Partial<DomainEventEnvelope> = {},
): DomainEventEnvelope {
  return {
    id: 'event-1' as DomainEventId,
    organizationId: ORGANIZATION_ID,
    eventType: 'project.created',
    eventVersion: 1,
    aggregateType: 'Project',
    aggregateId: PROJECT_ID,
    payload: { name: 'Alpha Study' },
    status: 'PUBLISHED',
    occurredAt: NOW,
    availableAt: NOW,
    attempts: 0,
    ...overrides,
  };
}

export const MISSION_CONTROL_CONTEXT = {
  organizationId: ORGANIZATION_ID,
  role: 'MEMBER' as const,
};

export const REQUEST_CONTEXT = {
  userId: userId('user-1'),
  organizationId: ORGANIZATION_ID,
  membershipId: membershipId('membership-1'),
  role: 'MEMBER' as const,
  requestId: requestId('request-1'),
  correlationId: correlationId('correlation-1'),
};
