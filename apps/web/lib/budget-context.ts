import type {
  CreateBudgetCategoryContext,
  CreateBudgetContext,
  CreateBudgetLineContext,
  DeleteBudgetCategoryContext,
  DeleteBudgetContext,
  DeleteBudgetLineContext,
  GetBudgetContext,
  ListAllBudgetLinesContext,
  ListBudgetCategoriesContext,
  ListBudgetLinesContext,
  ListBudgetsContext,
  UpdateBudgetCategoryContext,
  UpdateBudgetContext,
  UpdateBudgetLineContext,
} from '@synaptria/application';
import type { ResolvedOrganizationContext } from '@synaptria/auth';

export function toCreateBudgetContext(context: ResolvedOrganizationContext): CreateBudgetContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}

export function toListBudgetsContext(context: ResolvedOrganizationContext): ListBudgetsContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}

export function toGetBudgetContext(context: ResolvedOrganizationContext): GetBudgetContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}

export function toUpdateBudgetContext(context: ResolvedOrganizationContext): UpdateBudgetContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}

export function toDeleteBudgetContext(context: ResolvedOrganizationContext): DeleteBudgetContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}

export function toCreateBudgetLineContext(context: ResolvedOrganizationContext): CreateBudgetLineContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}

export function toUpdateBudgetLineContext(context: ResolvedOrganizationContext): UpdateBudgetLineContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}

export function toDeleteBudgetLineContext(context: ResolvedOrganizationContext): DeleteBudgetLineContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}

export function toListBudgetLinesContext(context: ResolvedOrganizationContext): ListBudgetLinesContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}

export function toListBudgetCategoriesContext(context: ResolvedOrganizationContext): ListBudgetCategoriesContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}

export function toListAllBudgetLinesContext(context: ResolvedOrganizationContext): ListAllBudgetLinesContext {
  return {
    organizationId: context.organizationId,
    role: context.role,
  };
}

export function toCreateBudgetCategoryContext(context: ResolvedOrganizationContext): CreateBudgetCategoryContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}

export function toUpdateBudgetCategoryContext(context: ResolvedOrganizationContext): UpdateBudgetCategoryContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}

export function toDeleteBudgetCategoryContext(context: ResolvedOrganizationContext): DeleteBudgetCategoryContext {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    membershipId: context.membershipId,
    role: context.role,
    requestId: context.requestId,
    correlationId: context.correlationId,
  };
}
