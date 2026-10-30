import type {
  CreateDocumentContext,
  DeleteDocumentContext,
  GetDocumentContext,
  ListDocumentsContext,
  ListDocumentsForProgramContext,
  ListDocumentsForProjectContext,
  UpdateDocumentContext,
} from '@synaptria/application';
import type { ResolvedOrganizationContext } from '@synaptria/auth';

export function toCreateDocumentContext(context: ResolvedOrganizationContext): CreateDocumentContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}

export function toListDocumentsContext(context: ResolvedOrganizationContext): ListDocumentsContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}

export function toGetDocumentContext(context: ResolvedOrganizationContext): GetDocumentContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}

export function toUpdateDocumentContext(context: ResolvedOrganizationContext): UpdateDocumentContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}

export function toDeleteDocumentContext(context: ResolvedOrganizationContext): DeleteDocumentContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}

export function toListDocumentsForProgramContext(context: ResolvedOrganizationContext): ListDocumentsForProgramContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}

export function toListDocumentsForProjectContext(context: ResolvedOrganizationContext): ListDocumentsForProjectContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}
