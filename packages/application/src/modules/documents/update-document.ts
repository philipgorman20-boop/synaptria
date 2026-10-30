import { AuditService } from '@synaptria/audit';
import {
  CryptoIdGenerator,
  SystemClock,
  type Clock,
  type CorrelationId,
  type DocumentId,
  type IdGenerator,
  type MembershipId,
  type OrganizationId,
  type ProgramId,
  type ProjectId,
  type RequestId,
  type UserId,
} from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type {
  Document,
  DocumentStatus,
  DocumentType,
  UpdateDocumentInput as RepositoryUpdateDocumentInput,
} from '@synaptria/domain/documents';
import { DomainEventService } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';
import type { DocumentUnitOfWork } from './document-unit-of-work';

export interface UpdateDocumentContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface UpdateDocumentInput {
  readonly documentId: DocumentId;
  readonly title?: string;
  readonly description?: string | null;
  readonly type?: DocumentType;
  readonly status?: DocumentStatus;
  readonly sourceUrl?: string | null;
  readonly programId?: ProgramId | null;
  readonly projectId?: ProjectId | null;
}

export interface UpdateDocumentOutput {
  readonly document: Document;
}

export class UpdateDocumentUseCase {
  constructor(
    private readonly unitOfWork: DocumentUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(context: UpdateDocumentContext, input: UpdateDocumentInput): Promise<UpdateDocumentOutput> {
    requirePermission(context.role, PERMISSIONS.DOCUMENTS_UPLOAD);

    const repositoryInput: RepositoryUpdateDocumentInput = {};

    if (input.title !== undefined) {
      const title = input.title.trim();
      if (title.length === 0) {
        throw new ApplicationError({ code: 'VALIDATION_FAILED', message: 'title cannot be empty.', details: { field: 'title' } });
      }
      (repositoryInput as Record<string, unknown>).title = title;
    }

    if (input.description !== undefined) (repositoryInput as Record<string, unknown>).description = input.description;
    if (input.type !== undefined) (repositoryInput as Record<string, unknown>).type = input.type;
    if (input.status !== undefined) (repositoryInput as Record<string, unknown>).status = input.status;
    if (input.sourceUrl !== undefined) (repositoryInput as Record<string, unknown>).sourceUrl = input.sourceUrl;
    if (input.programId !== undefined) (repositoryInput as Record<string, unknown>).programId = input.programId;
    if (input.projectId !== undefined) (repositoryInput as Record<string, unknown>).projectId = input.projectId;

    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const existing = await repositories.documents.findById(context.organizationId, input.documentId);
      if (existing === null || existing.deletedAt !== undefined) {
        throw new ApplicationError({ code: 'NOT_FOUND', message: 'Document not found.', details: { field: 'documentId' } });
      }

      const document = await repositories.documents.update(context.organizationId, input.documentId, repositoryInput);

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: { type: 'USER', id: context.userId, userId: context.userId },
        action: 'UPDATE',
        target: { entityType: 'Document', entityId: document.id },
        request: { requestId: context.requestId, correlationId: context.correlationId },
        before: { id: existing.id, title: existing.title, status: existing.status },
        after: { id: document.id, title: document.title, status: document.status },
        occurredAt,
      });

      const events = new DomainEventService(repositories.events, this.clock, this.eventIdGenerator);
      await events.publish({
        context: {
          userId: context.userId,
          organizationId: context.organizationId,
          membershipId: context.membershipId,
          role: context.role,
          requestId: context.requestId,
          correlationId: context.correlationId,
        },
        event: {
          type: 'document.updated',
          aggregateType: 'Document',
          aggregateId: document.id,
          payload: {
            documentId: document.id,
            organizationId: context.organizationId,
            title: document.title,
            status: document.status,
            updatedByUserId: context.userId,
          },
          occurredAt,
        },
      });

      return { document };
    });
  }
}
