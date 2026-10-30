import type {
  DecisionId,
  DocumentId,
  MilestoneId,
  OrganizationId,
  ProgramId,
  ProjectId,
  RiskId,
  UserId,
  VendorId,
} from '@synaptria/core';

import type { Document, DocumentStatus, DocumentType } from './models';

export interface CreateDocumentInput {
  readonly organizationId: OrganizationId;
  readonly createdById?: UserId;
  readonly programId?: ProgramId;
  readonly projectId?: ProjectId;
  readonly milestoneId?: MilestoneId;
  readonly vendorId?: VendorId;
  readonly riskId?: RiskId;
  readonly decisionId?: DecisionId;
  readonly title: string;
  readonly description?: string;
  readonly type?: DocumentType;
  readonly status?: DocumentStatus;
  readonly sourceUrl?: string;
  readonly tags?: readonly string[];
}

export interface UpdateDocumentInput {
  readonly title?: string;
  readonly description?: string | null;
  readonly type?: DocumentType;
  readonly status?: DocumentStatus;
  readonly sourceUrl?: string | null;
  readonly tags?: readonly string[];
  readonly programId?: ProgramId | null;
  readonly projectId?: ProjectId | null;
}

export interface DocumentRepository {
  create(input: CreateDocumentInput): Promise<Document>;
  findById(organizationId: OrganizationId, id: DocumentId): Promise<Document | null>;
  update(organizationId: OrganizationId, id: DocumentId, input: UpdateDocumentInput): Promise<Document>;
  softDelete(organizationId: OrganizationId, id: DocumentId, deletedAt: Date): Promise<Document>;
  listForOrganization(organizationId: OrganizationId): Promise<readonly Document[]>;
  listForProgram(organizationId: OrganizationId, programId: ProgramId): Promise<readonly Document[]>;
  listForProject(organizationId: OrganizationId, projectId: ProjectId): Promise<readonly Document[]>;
  listForVendor(organizationId: OrganizationId, vendorId: VendorId): Promise<readonly Document[]>;
}
