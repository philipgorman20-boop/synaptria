import {
  CreateDecisionUseCase,
  DecisionService,
  DeleteDecisionUseCase,
  GetDecisionUseCase,
  ListDecisionsUseCase,
  UpdateDecisionUseCase,
  type DecisionTransactionRepositories,
  type DecisionUnitOfWork,
} from '@synaptria/application';
import {
  createPersistenceRepositories,
  db,
  withDatabaseTransaction,
} from '@synaptria/database';

class PrismaDecisionUnitOfWork implements DecisionUnitOfWork {
  async execute<T>(
    operation: (repositories: DecisionTransactionRepositories) => Promise<T>,
  ): Promise<T> {
    return withDatabaseTransaction(db, async (repositories) =>
      operation({
        decisions: repositories.decisions,
        audit: repositories.audit,
        events: repositories.events,
      }),
    );
  }
}

const repositories = createPersistenceRepositories(db);
const decisionUnitOfWork = new PrismaDecisionUnitOfWork();

const decisionService = new DecisionService(
  new CreateDecisionUseCase(decisionUnitOfWork),
  new ListDecisionsUseCase(repositories.decisions),
  new GetDecisionUseCase(repositories.decisions),
  new UpdateDecisionUseCase(decisionUnitOfWork),
  new DeleteDecisionUseCase(decisionUnitOfWork),
);

export function getDecisionService(): DecisionService {
  return decisionService;
}
