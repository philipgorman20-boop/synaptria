import type { OrganizationId, ProgramId } from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type { Document, DocumentRepository } from '@synaptria/domain/documents';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

export interface ListDocumentsForProgramContext {
  readonly organizationId: OrganizationId;
  readonly role: OrganizationRole;
}

export interface ListDocumentsForProgramInput {
  readonly programId: ProgramId;
}

export interface ListDocumentsForProgramOutput {
  readonly documents: readonly Document[];
}

export class ListDocumentsForProgramUseCase {
  constructor(private readonly documents: DocumentRepository) {}

  async execute(
    context: ListDocumentsForProgramContext,
    input: ListDocumentsForProgramInput,
  ): Promise<ListDocumentsForProgramOutput> {
    requirePermission(context.role, PERMISSIONS.DOCUMENTS_READ);

    const documents = await this.documents.listForProgram(
      context.organizationId,
      input.programId,
    );

    return { documents: documents.filter((d) => d.deletedAt === undefined) };
  }
}
