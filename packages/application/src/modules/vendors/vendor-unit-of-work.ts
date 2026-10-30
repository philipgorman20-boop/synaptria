import type { AuditRepository } from '@synaptria/audit';
import type { VendorRepository } from '@synaptria/domain/vendors';
import type { EventRepository } from '@synaptria/events';

export interface VendorTransactionRepositories {
  readonly vendors: VendorRepository;
  readonly audit: AuditRepository;
  readonly events: EventRepository;
}

export interface VendorUnitOfWork {
  execute<T>(
    operation: (repositories: VendorTransactionRepositories) => Promise<T>,
  ): Promise<T>;
}
