import {
  CreateOrganizationUseCase,
  ListOrganizationsUseCase,
  OrganizationService,
  SwitchOrganizationUseCase,
  type OrganizationTransactionRepositories,
  type OrganizationUnitOfWork,
} from '@synaptria/application';
import {
  createPersistenceRepositories,
  db,
  withDatabaseTransaction,
} from '@synaptria/database';

class PrismaOrganizationUnitOfWork implements OrganizationUnitOfWork {
  async execute<T>(
    operation: (
      repositories: OrganizationTransactionRepositories,
    ) => Promise<T>,
  ): Promise<T> {
    return withDatabaseTransaction(db, async (repositories) =>
      operation(repositories),
    );
  }
}

const repositories = createPersistenceRepositories(db);
const organizationUnitOfWork = new PrismaOrganizationUnitOfWork();

const organizationService = new OrganizationService(
  new CreateOrganizationUseCase(organizationUnitOfWork),
  new ListOrganizationsUseCase(repositories.organizations),
  new SwitchOrganizationUseCase(organizationUnitOfWork),
);

/** Shared application-service composition root for the web delivery layer. */
export function getOrganizationService(): OrganizationService {
  return organizationService;
}
