import { ApplicationError } from '@synaptria/application';
import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { budgetId } from '@synaptria/core';
import { notFound, redirect } from 'next/navigation';

import { toGetBudgetContext } from '../../../lib/budget-context';
import { toListBudgetCategoriesContext, toListBudgetLinesContext } from '../../../lib/budget-context';
import { getBudgetLineService, getBudgetService } from '../../../lib/budget-service';
import { getRequestContext } from '../../../lib/request-context';
import { getProgramService } from '../../../lib/program-service';
import { getProjectService } from '../../../lib/project-service';
import { toListProgramsContext } from '../../../lib/program-context';
import { toListProjectsContext } from '../../../lib/project-context';
import { parseBudgetRouteParam } from '../budgets-format';

import { DeleteBudgetDialog } from '../components/delete-budget-dialog';
import { EditBudgetDialog } from '../components/edit-budget-dialog';
import { BudgetDetailHeader } from '../components/budget-detail-header';
import { BudgetDetailMetadata } from '../components/budget-detail-metadata';
import { BudgetCategoriesSection } from '../components/budget-categories-section';
import { BudgetLinesSection } from '../components/budget-lines-section';

export interface BudgetDetailPageProps {
  readonly params: Promise<{ readonly budgetId: string }>;
}

export default async function BudgetDetailPage({ params }: BudgetDetailPageProps) {
  const { budgetId: rawBudgetId } = await params;
  const parsedBudgetId = parseBudgetRouteParam(rawBudgetId);

  if (parsedBudgetId === null) notFound();

  let context: ResolvedOrganizationContext;

  try {
    context = await getRequestContext();
  } catch (error) {
    if (error instanceof AuthenticationError) redirect('/sign-in');
    if (error instanceof OrganizationMembershipRequiredError) redirect('/no-organization');
    throw error;
  }

  let budget;

  try {
    ({ budget } = await getBudgetService().getBudget(toGetBudgetContext(context), { budgetId: parsedBudgetId }));
  } catch (error) {
    if (error instanceof ApplicationError && error.code === 'NOT_FOUND') notFound();
    throw error;
  }

  const [linesResult, categoriesResult, programResult, projectResult] = await Promise.all([
    getBudgetLineService().listBudgetLines(toListBudgetLinesContext(context), { budgetId: parsedBudgetId }),
    getBudgetLineService().listBudgetCategories(toListBudgetCategoriesContext(context)),
    getProgramService().listPrograms(toListProgramsContext(context)),
    getProjectService().listProjects(toListProjectsContext(context)),
  ]);

  const programs = programResult.programs.filter((p) => p.deletedAt === undefined);
  const projects = projectResult.projects.filter((p) => p.deletedAt === undefined);

  return (
    <main className="dashboard">
      <BudgetDetailHeader
        budget={budget}
        actions={
          <>
            <EditBudgetDialog budget={budget} />
            <DeleteBudgetDialog budget={budget} />
          </>
        }
      />
      <BudgetDetailMetadata budget={budget} />
      <BudgetCategoriesSection
        categories={categoriesResult.budgetCategories.filter((c) => c.deletedAt === undefined)}
      />
      <BudgetLinesSection
        budgetId={parsedBudgetId}
        lines={linesResult.budgetLines}
        categories={categoriesResult.budgetCategories}
        programs={programs}
        projects={projects}
      />
    </main>
  );
}
