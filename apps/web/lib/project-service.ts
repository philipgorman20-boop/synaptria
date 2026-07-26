import {
  CreateProjectUseCase,
  GetProjectUseCase,
  ListProgramProjectsUseCase,
  ListProjectsUseCase,
  ProjectService,
  type ProjectTransactionRepositories,
  type ProjectUnitOfWork,
} from '@synaptria/application';
import {
  createPersistenceRepositories,
  db,
  withDatabaseTransaction,
} from '@synaptria/database';

class PrismaProjectUnitOfWork implements ProjectUnitOfWork {
  async execute<T>(
    operation: (
      repositories: ProjectTransactionRepositories,
    ) => Promise<T>,
  ): Promise<T> {
    return withDatabaseTransaction(db, async (repositories) =>
      operation({
        projects: repositories.projects,
        programs: repositories.programs,
        audit: repositories.audit,
        events: repositories.events,
      }),
    );
  }
}

const repositories = createPersistenceRepositories(db);
const projectUnitOfWork = new PrismaProjectUnitOfWork();

const projectService = new ProjectService(
  new CreateProjectUseCase(projectUnitOfWork),
  new ListProjectsUseCase(repositories.projects),
  new ListProgramProjectsUseCase(repositories.projects, repositories.programs),
  new GetProjectUseCase(repositories.projects),
);

/** Shared application-service composition root for the Projects module. */
export function getProjectService(): ProjectService {
  return projectService;
}
