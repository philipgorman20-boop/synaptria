import {
  CreateVendorUseCase,
  DeleteVendorUseCase,
  GetVendorUseCase,
  ListVendorsUseCase,
  UpdateVendorUseCase,
  VendorService,
  type VendorTransactionRepositories,
  type VendorUnitOfWork,
} from '@synaptria/application';
import {
  createPersistenceRepositories,
  db,
  withDatabaseTransaction,
} from '@synaptria/database';

class PrismaVendorUnitOfWork implements VendorUnitOfWork {
  async execute<T>(
    operation: (repositories: VendorTransactionRepositories) => Promise<T>,
  ): Promise<T> {
    return withDatabaseTransaction(db, async (repositories) =>
      operation({
        vendors: repositories.vendors,
        audit: repositories.audit,
        events: repositories.events,
      }),
    );
  }
}

const repositories = createPersistenceRepositories(db);
const vendorUnitOfWork = new PrismaVendorUnitOfWork();

const vendorService = new VendorService(
  new CreateVendorUseCase(vendorUnitOfWork),
  new ListVendorsUseCase(repositories.vendors),
  new GetVendorUseCase(repositories.vendors),
  new UpdateVendorUseCase(vendorUnitOfWork),
  new DeleteVendorUseCase(vendorUnitOfWork),
);

export function getVendorService(): VendorService {
  return vendorService;
}
