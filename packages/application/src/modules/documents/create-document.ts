import { AuditService } from '@synaptria/audit';
import {
  CryptoIdGenerator,
  SystemClock,
  type Clock,
  type CorrelationId,
  type DecisionId,
  type IdGenerator,
  type MembershipId,
  type MilestoneId,
  type OrganizationId,
  type ProgramId,
  type ProjectId,
  type RequestId,
  type RiskId,
  type UserId,
  type VendorId,
} from '@synaptria/core';
import type { OrganizationRole } from '@synaptria/core/context';
import type {
  CreateDocumentInput as RepositoryCreateDocumentInput,
  Document,
  DocumentStatus,
  DocumentType,
} from '@synaptria/domain/documents';
import { DomainEventService } from '@synaptria/events';
import { PERMISSIONS, requirePermission } from '@synaptria/permissions';

import { ApplicationError } from '../../shared/application-error';
import type { DocumentUnitOfWork } from './document-unit-of-work';

export interface CreateDocumentContext {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly membershipId: MembershipId;
  readonly role: OrganizationRole;
  readonly requestId: RequestId;
  readonly correlationId: CorrelationId;
}

export interface CreateDocumentInput {
  readonly title: string;
  readonly description?: string;
  readonly type?: DocumentType;
  readonly status?: DocumentStatus;
  readonly sourceUrl?: string;
  readonly tags?: readonly string[];
  readonly programId?: ProgramId;
  readonly projectId?: ProjectId;
  readonly milestoneId?: MilestoneId;
  readonly vendorId?: VendorId;
  readonly riskId?: RiskId;
  readonly decisionId?: DecisionId;
}

export interface CreateDocumentOutput {
  readonly document: Document;
}

export class CreateDocumentUseCase {
  constructor(
    private readonly unitOfWork: DocumentUnitOfWork,
    private readonly clock: Clock = new SystemClock(),
    private readonly eventIdGenerator: IdGenerator = new CryptoIdGenerator(),
  ) {}

  async execute(context: CreateDocumentContext, input: CreateDocumentInput): Promise<CreateDocumentOutput> {
    requirePermission(context.role, PERMISSIONS.DOCUMENTS_UPLOAD);

    const title = requireText(input.title, 'title');
    const occurredAt = this.clock.now();

    return this.unitOfWork.execute(async (repositories) => {
      const repositoryInput: RepositoryCreateDocumentInput = {
        organizationId: context.organizationId,
        title,
        createdById: context.userId,
        ...(input.type === undefined ? {} : { type: input.type }),
        ...(input.status === undefined ? {} : { status: input.status }),
        ...(input.description === undefined ? {} : { description: input.description }),
        ...(input.sourceUrl === undefined ? {} : { sourceUrl: input.sourceUrl }),
        ...(input.tags === undefined ? {} : { tags: input.tags }),
        ...(input.programId === undefined ? {} : { programId: input.programId }),
        ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
        ...(input.milestoneId === undefined ? {} : { milestoneId: input.milestoneId }),
        ...(input.vendorId === undefined ? {} : { vendorId: input.vendorId }),
        ...(input.riskId === undefined ? {} : { riskId: input.riskId }),
        ...(input.decisionId === undefined ? {} : { decisionId: input.decisionId }),
      };

      const document = await repositories.documents.create(repositoryInput);

      const audit = new AuditService(repositories.audit, this.clock);
      await audit.record({
        organizationId: context.organizationId,
        actor: { type: 'USER', id: context.userId, userId: context.userId },
        action: 'CREATE',
        target: { entityType: 'Document', entityId: document.id },
        request: { requestId: context.requestId, correlationId: context.correlationId },
        after: { id: document.id, title: document.title, type: document.type, status: document.status },
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
          type: 'document.created',
          aggregateType: 'Document',
          aggregateId: document.id,
          payload: {
            documentId: document.id,
            organizationId: context.organizationId,
            title: document.title,
            type: document.type,
            status: document.status,
            createdByUserId: context.userId,
          },
          occurredAt,
        },
      });

      return { document };
    });
  }
}

function requireText(value: string, field: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new ApplicationError({ code: 'VALIDATION_FAILED', message: `${field} cannot be empty.`, details: { field } });
  }
  return normalized;
}
