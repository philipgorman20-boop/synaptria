import {
  CreateProgramUseCase,
  GetProgramUseCase,
  ListProgramsUseCase,
  ProgramService,
  type ProgramTransactionRepositories,
  type ProgramUnitOfWork,
} from '@synaptria/application';
import {
  createPersistenceRepositories,
  db,
  withDatabaseTransaction,
} from '@synaptria/database';

class PrismaProgramUnitOfWork implements ProgramUnitOfWork {
  async execute<T>(
    operation: (
      repositories: ProgramTransactionRepositories,
    ) => Promise<T>,
  ): Promise<T> {
    return withDatabaseTransaction(db, async (repositories) =>
      operation({
        programs: repositories.programs,
        audit: repositories.audit,
        events: repositories.events,
      }),
    );
  }
}

const repositories = createPersistenceRepositories(db);
const programUnitOfWork = new PrismaProgramUnitOfWork();

const programService = new ProgramService(
  new CreateProgramUseCase(programUnitOfWork),
  new ListProgramsUseCase(repositories.programs),
  new GetProgramUseCase(repositories.programs),
);

/** Shared application-service composition root for the Programs module. */
export function getProgramService(): ProgramService {
  return programService;
}
