import {
  Prisma,
  type Document as PrismaDocument,
  type PrismaClient,
} from '@prisma/client';
import {
  decisionId,
  documentId,
  identifier,
  milestoneId,
  programId,
  projectId,
  riskId,
  userId,
  vendorId,
  type DecisionId,
  type DocumentId,
  type OrganizationId,
  type ProgramId,
  type ProjectId,
  type RiskId,
  type VendorId,
} from '@synaptria/core';
import { NotFoundError } from '@synaptria/core/errors';
import type {
  CreateDocumentInput,
  Document,
  DocumentRepository,
  DocumentStatus,
  DocumentType,
  UpdateDocumentInput,
} from '@synaptria/domain/documents';

export type DocumentDatabaseClient = Pick<PrismaClient, 'document'>;

const DOCUMENT_SELECT = {
  id: true,
  organizationId: true,
  createdById: true,
  programId: true,
  projectId: true,
  milestoneId: true,
  vendorId: true,
  riskId: true,
  decisionId: true,
  title: true,
  description: true,
  type: true,
  status: true,
  currentVersion: true,
  sourceUrl: true,
  tags: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.DocumentSelect;

type SelectedDocument = Prisma.DocumentGetPayload<{ select: typeof DOCUMENT_SELECT }>;

const activeDocumentWhere = (organizationId: OrganizationId): Prisma.DocumentWhereInput => ({
  organizationId,
  deletedAt: null,
});

export class PrismaDocumentRepository implements DocumentRepository {
  constructor(private readonly client: DocumentDatabaseClient) {}

  async create(input: CreateDocumentInput): Promise<Document> {
    const data: Prisma.DocumentUncheckedCreateInput = {
      organizationId: input.organizationId,
      title: input.title,
      type: input.type ?? 'GENERAL',
      status: input.status ?? 'DRAFT',
      tags: input.tags ? [...input.tags] : [],
      ...(input.createdById === undefined ? {} : { createdById: input.createdById }),
      ...(input.programId === undefined ? {} : { programId: input.programId }),
      ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
      ...(input.milestoneId === undefined ? {} : { milestoneId: input.milestoneId }),
      ...(input.vendorId === undefined ? {} : { vendorId: input.vendorId }),
      ...(input.riskId === undefined ? {} : { riskId: input.riskId }),
      ...(input.decisionId === undefined ? {} : { decisionId: input.decisionId }),
      ...(input.description === undefined ? {} : { description: input.description }),
      ...(input.sourceUrl === undefined ? {} : { sourceUrl: input.sourceUrl }),
    };

    const row = await this.client.document.create({ data, select: DOCUMENT_SELECT });
    return mapDocument(row);
  }

  async findById(organizationId: OrganizationId, id: DocumentId): Promise<Document | null> {
    const row = await this.client.document.findFirst({
      where: { ...activeDocumentWhere(organizationId), id },
      select: DOCUMENT_SELECT,
    });
    return row === null ? null : mapDocument(row);
  }

  async update(organizationId: OrganizationId, id: DocumentId, input: UpdateDocumentInput): Promise<Document> {
    const existing = await this.findById(organizationId, id);
    if (existing === null) throw new NotFoundError('Document', { documentId: id, organizationId });

    const data: Prisma.DocumentUpdateInput = {
      ...(input.title === undefined ? {} : { title: input.title }),
      ...(input.description === undefined ? {} : { description: input.description }),
      ...(input.type === undefined ? {} : { type: input.type }),
      ...(input.status === undefined ? {} : { status: input.status }),
      ...(input.sourceUrl === undefined ? {} : { sourceUrl: input.sourceUrl }),
      ...(input.tags === undefined ? {} : { tags: [...input.tags] }),
      ...(input.programId === undefined ? {} : { programId: input.programId }),
      ...(input.projectId === undefined ? {} : { projectId: input.projectId }),
    };

    const row = await this.client.document.update({ where: { id }, data, select: DOCUMENT_SELECT });
    return mapDocument(row);
  }

  async softDelete(organizationId: OrganizationId, id: DocumentId, deletedAt: Date): Promise<Document> {
    const existing = await this.findById(organizationId, id);
    if (existing === null) throw new NotFoundError('Document', { documentId: id, organizationId });

    const row = await this.client.document.update({ where: { id }, data: { deletedAt }, select: DOCUMENT_SELECT });
    return mapDocument(row);
  }

  async listForOrganization(organizationId: OrganizationId): Promise<readonly Document[]> {
    const rows = await this.client.document.findMany({
      where: activeDocumentWhere(organizationId),
      select: DOCUMENT_SELECT,
      orderBy: [{ updatedAt: 'desc' }],
    });
    return rows.map(mapDocument);
  }

  async listForProgram(organizationId: OrganizationId, pid: ProgramId): Promise<readonly Document[]> {
    const rows = await this.client.document.findMany({
      where: { ...activeDocumentWhere(organizationId), programId: pid },
      select: DOCUMENT_SELECT,
      orderBy: [{ updatedAt: 'desc' }],
    });
    return rows.map(mapDocument);
  }

  async listForProject(organizationId: OrganizationId, pid: ProjectId): Promise<readonly Document[]> {
    const rows = await this.client.document.findMany({
      where: { ...activeDocumentWhere(organizationId), projectId: pid },
      select: DOCUMENT_SELECT,
      orderBy: [{ updatedAt: 'desc' }],
    });
    return rows.map(mapDocument);
  }

  async listForVendor(organizationId: OrganizationId, vid: VendorId): Promise<readonly Document[]> {
    const rows = await this.client.document.findMany({
      where: { ...activeDocumentWhere(organizationId), vendorId: vid },
      select: DOCUMENT_SELECT,
      orderBy: [{ updatedAt: 'desc' }],
    });
    return rows.map(mapDocument);
  }
}

export function mapDocument(row: SelectedDocument | PrismaDocument): Document {
  return {
    id: documentId(row.id),
    organizationId: identifier(row.organizationId, 'OrganizationId') as OrganizationId,
    ...(row.createdById === null ? {} : { createdById: userId(row.createdById) }),
    ...(row.programId === null ? {} : { programId: programId(row.programId) }),
    ...(row.projectId === null ? {} : { projectId: projectId(row.projectId) }),
    ...(row.milestoneId === null ? {} : { milestoneId: milestoneId(row.milestoneId) }),
    ...(row.vendorId === null ? {} : { vendorId: vendorId(row.vendorId) }),
    ...(row.riskId === null ? {} : { riskId: riskId(row.riskId) }),
    ...(row.decisionId === null ? {} : { decisionId: decisionId(row.decisionId) }),
    title: row.title,
    ...(row.description === null ? {} : { description: row.description }),
    type: row.type as DocumentType,
    status: row.status as DocumentStatus,
    currentVersion: row.currentVersion,
    ...(row.sourceUrl === null ? {} : { sourceUrl: row.sourceUrl }),
    tags: row.tags,
    ...(row.deletedAt === null ? {} : { deletedAt: row.deletedAt }),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
