import {
  AggregateEventContextProvider,
  AssembleContextUseCase,
  ContextAssemblerService,
  createDefaultContextAssemblyAuthorizer,
  NoOpOrganizationalMemoryProvider,
  PrimaryEntityContextProvider,
  RelatedEntitiesContextProvider,
} from '@synaptria/application';
import { CryptoIdGenerator, SystemClock } from '@synaptria/core';
import { createPersistenceRepositories, db } from '@synaptria/database';

const repositories = createPersistenceRepositories(db);
const clock = new SystemClock();
const packageIdGenerator = new CryptoIdGenerator();

const assembleContextUseCase = new AssembleContextUseCase({
  clock,
  packageIdGenerator,
  primaryEntityProvider: new PrimaryEntityContextProvider(
    repositories.projects,
    repositories.milestones,
    clock,
  ),
  relatedEntitiesProvider: new RelatedEntitiesContextProvider(
    repositories.projects,
    repositories.milestones,
    repositories.tasks,
    clock,
  ),
  aggregateEventProvider: new AggregateEventContextProvider(
    repositories.events,
    repositories.milestones,
    repositories.tasks,
    clock,
  ),
  organizationalMemoryProvider: new NoOpOrganizationalMemoryProvider(clock),
  contextAssemblyAuthorizer: createDefaultContextAssemblyAuthorizer(),
});

const contextAssemblerService = new ContextAssemblerService(assembleContextUseCase);

/** Shared application-service composition root for the Context Engine module. */
export function getContextService(): ContextAssemblerService {
  return contextAssemblerService;
}
