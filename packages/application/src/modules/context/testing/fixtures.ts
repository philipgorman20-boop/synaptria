import {
  correlationId,
  membershipId,
  milestoneId,
  organizationId,
  projectId,
  requestId,
  taskId,
  userId,
  type MilestoneId,
  type OrganizationId,
  type ProjectId,
  type TaskId,
} from '@synaptria/core';
import type { Milestone, MilestoneRepository } from '@synaptria/domain/milestones';
import type { Project, ProjectRepository } from '@synaptria/domain/projects';
import type { Task, TaskRepository } from '@synaptria/domain/tasks';
import type {
  AggregateEventQuery,
  DomainEventEnvelope,
  DomainEventId,
  DomainEventStatus,
  EventRepository,
  OrganizationRecentEventsQuery,
} from '@synaptria/events';
import { filterRecentOrganizationEvents } from '@synaptria/events';

export const NOW = new Date('2026-07-26T16:00:00.000Z');
export const USER_ID = userId('user-1');
export const ORGANIZATION_ID = organizationId('org-1');
export const OTHER_ORGANIZATION_ID = organizationId('org-2');
export const MEMBERSHIP_ID = membershipId('membership-1');
export const REQUEST_ID = requestId('request-1');
export const CORRELATION_ID = correlationId('correlation-1');
export const PROJECT_ID = projectId('project-1');
export const MILESTONE_ID = milestoneId('milestone-1');
export const MILESTONE_B_ID = milestoneId('milestone-2');
export const TASK_ID = taskId('task-1');
export const TASK_B_ID = taskId('task-2');
export const PACKAGE_ID = 'package-1';

export function projectFixture(overrides: Partial<Project> = {}): Project {
  return {
    id: PROJECT_ID,
    organizationId: ORGANIZATION_ID,
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

  async listForOrganization(): Promise<readonly Project[]> {
    return this.projects;
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

  async listForOrganization(): Promise<readonly Milestone[]> {
    return this.milestones;
  }

  async listForProject(
    organizationId: OrganizationId,
    projectIdValue: ProjectId,
  ): Promise<readonly Milestone[]> {
    return this.milestones.filter(
      (milestone) =>
        milestone.organizationId === organizationId && milestone.projectId === projectIdValue,
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
      this.tasks.find((task) => task.organizationId === organizationId && task.id === id) ?? null
    );
  }

  async create(): Promise<Task> {
    throw new Error('Not implemented.');
  }

  async listForOrganization(): Promise<readonly Task[]> {
    return this.tasks;
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

  async findByAggregate(query: AggregateEventQuery): Promise<readonly DomainEventEnvelope[]> {
    return this.events.filter(
      (event) =>
        event.organizationId === query.organizationId &&
        event.aggregateType === query.aggregateType &&
        event.aggregateId === query.aggregateId,
    ).slice(0, query.limit);
  }

  async listRecentForOrganization(
    query: OrganizationRecentEventsQuery,
  ): Promise<readonly DomainEventEnvelope[]> {
    return filterRecentOrganizationEvents(this.events, query);
  }

  async updateStatus(
    id: DomainEventId,
    status: DomainEventStatus,
    _changes?: Readonly<{
      publishedAt?: Date;
      attempts?: number;
      lastError?: string | null;
    }>,
  ): Promise<DomainEventEnvelope> {
    const event = this.events.find((entry) => entry.id === id);
    if (event === undefined) {
      throw new Error('Event not found.');
    }

    return { ...event, status };
  }
}

export class SpyEventRepository extends InMemoryEventRepository {
  readonly aggregateQueries: AggregateEventQuery[] = [];

  override async findByAggregate(
    query: AggregateEventQuery,
  ): Promise<readonly DomainEventEnvelope[]> {
    this.aggregateQueries.push({ ...query });
    return super.findByAggregate(query);
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
