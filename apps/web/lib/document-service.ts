import {
  CreateDocumentUseCase,
  DeleteDocumentUseCase,
  DocumentService,
  GetDocumentUseCase,
  ListDocumentsUseCase,
  ListDocumentsForProgramUseCase,
  ListDocumentsForProjectUseCase,
  UpdateDocumentUseCase,
  type DocumentTransactionRepositories,
  type DocumentUnitOfWork,
} from '@synaptria/application';
import {
  createPersistenceRepositories,
  db,
  withDatabaseTransaction,
} from '@synaptria/database';

class PrismaDocumentUnitOfWork implements DocumentUnitOfWork {
  async execute<T>(
    operation: (repositories: DocumentTransactionRepositories) => Promise<T>,
  ): Promise<T> {
    return withDatabaseTransaction(db, async (repositories) =>
      operation({
        documents: repositories.documents,
        audit: repositories.audit,
        events: repositories.events,
      }),
    );
  }
}

const repositories = createPersistenceRepositories(db);
const documentUnitOfWork = new PrismaDocumentUnitOfWork();

const documentService = new DocumentService(
  new CreateDocumentUseCase(documentUnitOfWork),
  new ListDocumentsUseCase(repositories.documents),
  new ListDocumentsForProgramUseCase(repositories.documents),
  new ListDocumentsForProjectUseCase(repositories.documents),
  new GetDocumentUseCase(repositories.documents),
  new UpdateDocumentUseCase(documentUnitOfWork),
  new DeleteDocumentUseCase(documentUnitOfWork),
);

export function getDocumentService(): DocumentService {
  return documentService;
}
