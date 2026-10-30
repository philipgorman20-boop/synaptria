import {
  CreateRiskUseCase,
  DeleteRiskUseCase,
  GetRiskUseCase,
  ListRisksUseCase,
  RiskService,
  UpdateRiskUseCase,
  type RiskTransactionRepositories,
  type RiskUnitOfWork,
} from '@synaptria/application';
import {
  createPersistenceRepositories,
  db,
  withDatabaseTransaction,
} from '@synaptria/database';

class PrismaRiskUnitOfWork implements RiskUnitOfWork {
  async execute<T>(
    operation: (repositories: RiskTransactionRepositories) => Promise<T>,
  ): Promise<T> {
    return withDatabaseTransaction(db, async (repositories) =>
      operation({
        risks: repositories.risks,
        audit: repositories.audit,
        events: repositories.events,
      }),
    );
  }
}

const repositories = createPersistenceRepositories(db);
const riskUnitOfWork = new PrismaRiskUnitOfWork();

const riskService = new RiskService(
  new CreateRiskUseCase(riskUnitOfWork),
  new ListRisksUseCase(repositories.risks),
  new GetRiskUseCase(repositories.risks),
  new UpdateRiskUseCase(riskUnitOfWork),
  new DeleteRiskUseCase(riskUnitOfWork),
);

export function getRiskService(): RiskService {
  return riskService;
}
