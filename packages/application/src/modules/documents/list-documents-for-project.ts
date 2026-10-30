import type { OrganizationId, ProjectId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { Document, DocumentRepository } from '@synaptria/domain/documents';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

export interface ListDocumentsForProjectContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface ListDocumentsForProjectInput {
  readonly projectId: ProjectId;
}

export interface ListDocumentsForProjectOutput {
  readonly documents: readonly Document[];
}

export class ListDocumentsForProjectUseCase {
  constructor(private readonly documents: DocumentRepository) {}

  async execute(
    context: ListDocumentsForProjectContext,
    input: ListDocumentsForProjectInput,
  ): Promise<ListDocumentsForProjectOutput> {
    requirePermission(context.role, PERMISSIONS.DOCUMENTS_READ);

    const documents = await this.documents.listForProject(
      context.organizationId,
      input.projectId,
    );

    return { documents: documents.filter((d) => d.deletedAt === undefined) };
  }
}
