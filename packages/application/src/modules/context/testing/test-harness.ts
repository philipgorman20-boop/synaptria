import type { Clock, IdGenerator } from '@synaptria/core';
import { FixedClock } from '@synaptria/core';
import type { MilestoneRepository } from '@synaptria/domain/milestones';
import type { ProjectRepository } from '@synaptria/domain/projects';
import type { TaskRepository } from '@synaptria/domain/tasks';
import type { EventRepository } from '@synaptria/events';

import {
  AssembleContextUseCase,
  type AssembleContextDependencies,
} from '../assemble-context';
import { createDefaultContextAssemblyAuthorizer } from '../context-assembly-authorizer';
import { AggregateEventContextProvider } from '../providers/aggregate-event-provider';
import { NoOpOrganizationalMemoryProvider } from '../providers/no-op-organizational-memory-provider';
import { PrimaryEntityContextProvider } from '../providers/primary-entity-provider';
import { RelatedEntitiesContextProvider } from '../providers/related-entities-provider';

class FixedPackageIdGenerator implements IdGenerator {
  constructor(private readonly value: string) {}

  generate(): string {
    return this.value;
  }
}

export function createAssembleContextDependencies(input: {
  readonly projects: ProjectRepository;
  readonly milestones: MilestoneRepository;
  readonly tasks: TaskRepository;
  readonly events: EventRepository;
  readonly clock?: Clock;
  readonly packageId?: string;
}): AssembleContextDependencies {
  const clock = input.clock ?? new FixedClock(new Date('2026-07-26T16:00:00.000Z'));

  return {
    clock,
    packageIdGenerator: new FixedPackageIdGenerator(input.packageId ?? 'package-1'),
    primaryEntityProvider: new PrimaryEntityContextProvider(
      input.projects,
      input.milestones,
      clock,
    ),
    relatedEntitiesProvider: new RelatedEntitiesContextProvider(
      input.projects,
      input.milestones,
      input.tasks,
      clock,
    ),
    aggregateEventProvider: new AggregateEventContextProvider(
      input.events,
      input.milestones,
      input.tasks,
      clock,
    ),
    organizationalMemoryProvider: new NoOpOrganizationalMemoryProvider(clock),
    contextAssemblyAuthorizer: createDefaultContextAssemblyAuthorizer(),
  };
}

export function createAssembleContextUseCase(input: {
  readonly projects: ProjectRepository;
  readonly milestones: MilestoneRepository;
  readonly tasks: TaskRepository;
  readonly events: EventRepository;
  readonly clock?: Clock;
  readonly packageId?: string;
}): AssembleContextUseCase {
  return new AssembleContextUseCase(createAssembleContextDependencies(input));
}
