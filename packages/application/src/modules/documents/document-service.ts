import type { CreateDocumentContext, CreateDocumentInput, CreateDocumentOutput } from './create-document';
import { CreateDocumentUseCase } from './create-document';
import type { GetDocumentContext, GetDocumentInput, GetDocumentOutput } from './get-document';
import { GetDocumentUseCase } from './get-document';
import type { ListDocumentsContext, ListDocumentsOutput } from './list-documents';
import { ListDocumentsUseCase } from './list-documents';
import type { ListDocumentsForProgramContext, ListDocumentsForProgramInput, ListDocumentsForProgramOutput } from './list-documents-for-program';
import { ListDocumentsForProgramUseCase } from './list-documents-for-program';
import type { ListDocumentsForProjectContext, ListDocumentsForProjectInput, ListDocumentsForProjectOutput } from './list-documents-for-project';
import { ListDocumentsForProjectUseCase } from './list-documents-for-project';
import type { UpdateDocumentContext, UpdateDocumentInput, UpdateDocumentOutput } from './update-document';
import { UpdateDocumentUseCase } from './update-document';
import type { DeleteDocumentContext, DeleteDocumentInput, DeleteDocumentOutput } from './delete-document';
import { DeleteDocumentUseCase } from './delete-document';

export class DocumentService {
  constructor(
    private readonly createDocumentUseCase: CreateDocumentUseCase,
    private readonly listDocumentsUseCase: ListDocumentsUseCase,
    private readonly listDocumentsForProgramUseCase: ListDocumentsForProgramUseCase,
    private readonly listDocumentsForProjectUseCase: ListDocumentsForProjectUseCase,
    private readonly getDocumentUseCase: GetDocumentUseCase,
    private readonly updateDocumentUseCase: UpdateDocumentUseCase,
    private readonly deleteDocumentUseCase: DeleteDocumentUseCase,
  ) {}

  createDocument(context: CreateDocumentContext, input: CreateDocumentInput): Promise<CreateDocumentOutput> {
    return this.createDocumentUseCase.execute(context, input);
  }

  listDocuments(context: ListDocumentsContext): Promise<ListDocumentsOutput> {
    return this.listDocumentsUseCase.execute(context);
  }

  listDocumentsForProgram(context: ListDocumentsForProgramContext, input: ListDocumentsForProgramInput): Promise<ListDocumentsForProgramOutput> {
    return this.listDocumentsForProgramUseCase.execute(context, input);
  }

  listDocumentsForProject(context: ListDocumentsForProjectContext, input: ListDocumentsForProjectInput): Promise<ListDocumentsForProjectOutput> {
    return this.listDocumentsForProjectUseCase.execute(context, input);
  }

  getDocument(context: GetDocumentContext, input: GetDocumentInput): Promise<GetDocumentOutput> {
    return this.getDocumentUseCase.execute(context, input);
  }

  updateDocument(context: UpdateDocumentContext, input: UpdateDocumentInput): Promise<UpdateDocumentOutput> {
    return this.updateDocumentUseCase.execute(context, input);
  }

  deleteDocument(context: DeleteDocumentContext, input: DeleteDocumentInput): Promise<DeleteDocumentOutput> {
    return this.deleteDocumentUseCase.execute(context, input);
  }
}
