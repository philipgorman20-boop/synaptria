import {
  CreateMilestoneUseCase,
  GetMilestoneUseCase,
  ListMilestonesUseCase,
  ListProjectMilestonesUseCase,
  MilestoneService,
  type MilestoneTransactionRepositories,
  type MilestoneUnitOfWork,
} from '@synaptria/application';
import {
  createPersistenceRepositories,
  db,
  withMilestoneTransaction,
} from '@synaptria/database';

class PrismaMilestoneUnitOfWork implements MilestoneUnitOfWork {
  async execute<T>(
    operation: (
      repositories: MilestoneTransactionRepositories,
    ) => Promise<T>,
  ): Promise<T> {
    return withMilestoneTransaction(db, (repositories) => operation(repositories));
  }
}

const repositories = createPersistenceRepositories(db);
const milestoneUnitOfWork = new PrismaMilestoneUnitOfWork();

const milestoneService = new MilestoneService(
  new CreateMilestoneUseCase(milestoneUnitOfWork),
  new ListMilestonesUseCase(repositories.milestones),
  new ListProjectMilestonesUseCase(
    repositories.milestones,
    repositories.projects,
  ),
  new GetMilestoneUseCase(repositories.milestones),
);

/** Shared application-service composition root for the Milestones module. */
export function getMilestoneService(): MilestoneService {
  return milestoneService;
}
