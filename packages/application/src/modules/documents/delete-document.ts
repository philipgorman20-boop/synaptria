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
  type RequestId,
  type UserId,
} from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import { DomainEventService } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';
import type { DocumentUnitOfWork } from './document-unit-of-work';

export interface DeleteDocumentContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface DeleteDocumentInput {
  readonly documentId: DocumentId;
}

export interface DeleteDocumentOutput {
  readonly documentId: DocumentId;
}

export class DeleteDocumentUseCase {
  constructor(
    private readonly unitOfWork: DocumentUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(context: DeleteDocumentContext, input: DeleteDocumentInput): Promise<DeleteDocumentOutput> {
    requirePermission(context.role, PERMISSIONS.DOCUMENTS_UPLOAD);

    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const existing = await repositories.documents.findById(context.organizationId, input.documentId);
      if (existing === null || existing.deletedAt !== undefined) {
        throw new ApplicationError({ code: 'NOT_FOUND', message: 'Document not found.', details: { field: 'documentId' } });
      }

      const document = await repositories.documents.softDelete(context.organizationId, input.documentId, occurredAt);

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: { type: 'USER', id: context.userId, userId: context.userId },
        action: 'DELETE',
        target: { entityType: 'Document', entityId: document.id },
        request: { requestId: context.requestId, correlationId: context.correlationId },
        before: { id: existing.id, title: existing.title, status: existing.status },
        after: null,
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
          type: 'document.deleted',
          aggregateType: 'Document',
          aggregateId: document.id,
          payload: {
            documentId: document.id,
            organizationId: context.organizationId,
            deletedByUserId: context.userId,
          },
          occurredAt,
        },
      });

      return { documentId: document.id };
    });
  }
}
