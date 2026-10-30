import type { DocumentId, OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { Document, DocumentRepository } from '@synaptria/domain/documents';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';

export interface GetDocumentContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface GetDocumentInput {
  readonly documentId: DocumentId;
}

export interface GetDocumentOutput {
  readonly document: Document;
}

export class GetDocumentUseCase {
  constructor(private readonly documents: DocumentRepository) {}

  async execute(context: GetDocumentContext, input: GetDocumentInput): Promise<GetDocumentOutput> {
    requirePermission(context.role, PERMISSIONS.DOCUMENTS_READ);

    const document = await this.documents.findById(context.organizationId, input.documentId);

    if (document === null || document.deletedAt !== undefined) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Document not found.',
        details: { documentId: input.documentId },
      });
    }

    return { document };
  }
}
