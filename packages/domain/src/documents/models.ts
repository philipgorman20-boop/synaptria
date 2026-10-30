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

export type DocumentType =
  | 'GENERAL'
  | 'CONTRACT'
  | 'SOW'
  | 'QUOTE'
  | 'PURCHASE_ORDER'
  | 'INVOICE'
  | 'PROTOCOL'
  | 'REPORT'
  | 'PRESENTATION'
  | 'MEETING_NOTES'
  | 'BOARD_MATERIAL'
  | 'INVESTOR_MATERIAL'
  | 'REGULATORY'
  | 'IP'
  | 'POLICY'
  | 'OTHER';

export type DocumentStatus = 'DRAFT' | 'ACTIVE' | 'SUPERSEDED' | 'ARCHIVED';

export interface Document {
  readonly id: DocumentId;
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
  readonly type: DocumentType;
  readonly status: DocumentStatus;
  readonly currentVersion: number;
  readonly sourceUrl?: string;
  readonly tags: readonly string[];
  readonly deletedAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
