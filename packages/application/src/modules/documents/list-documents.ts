import type { OrganizationId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { Document, DocumentRepository } from '@synaptria/domain/documents';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

export interface ListDocumentsContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface ListDocumentsOutput {
  readonly documents: readonly Document[];
}

export class ListDocumentsUseCase {
  constructor(private readonly documents: DocumentRepository) {}

  async execute(context: ListDocumentsContext): Promise<ListDocumentsOutput> {
    requirePermission(context.role, PERMISSIONS.DOCUMENTS_READ);

    const documents = await this.documents.listForOrganization(context.organizationId);

    return { documents: documents.filter((d) => d.deletedAt === undefined) };
  }
}
