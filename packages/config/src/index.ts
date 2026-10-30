export const appConfig = {
  name: "Synaptria",
  description: "The AI Operating System for Biotech",
  defaultLocale: "en-US",
} as const;

export const routes = {
  home: "/",
  signIn: "/sign-in",
  dashboard: "/dashboard",
  companies: "/companies",
  contacts: "/contacts",
  opportunities: "/opportunities",
  projects: "/projects",
  programs: "/programs",
  recommendations: "/recommendations",
  actionProposals: "/action-proposals",
  risks: "/risks",
  decisions: "/decisions",
  vendors: "/vendors",
  documents: "/documents",
  budgets: "/budgets",
  finance: "/finance",
  settings: "/settings",
} as const;

/** Builds the canonical detail route for a program within the portfolio module. */
export function programRoute(programId: string): `${typeof routes.programs}/${string}` {
  return `${routes.programs}/${programId}`;
}

/** Builds the canonical detail route for a project within the portfolio module. */
export function projectRoute(projectId: string): `${typeof routes.projects}/${string}` {
  return `${routes.projects}/${projectId}`;
}

/** Builds the canonical detail route for a milestone within a project. */
export function milestoneRoute(
  projectId: string,
  milestoneId: string,
): `${typeof routes.projects}/${string}/milestones/${string}` {
  return `${routes.projects}/${projectId}/milestones/${milestoneId}`;
}

/** Builds the canonical list route for milestones within a project. */
export function projectMilestonesRoute(
  projectId: string,
): `${typeof routes.projects}/${string}/milestones` {
  return `${routes.projects}/${projectId}/milestones`;
}

/** Builds the canonical create route for a milestone within a project. */
export function newMilestoneRoute(
  projectId: string,
): `${typeof routes.projects}/${string}/milestones/new` {
  return `${routes.projects}/${projectId}/milestones/new`;
}

/** Builds the canonical list route for tasks within a milestone. */
export function milestoneTasksRoute(
  projectId: string,
  milestoneId: string,
): `${typeof routes.projects}/${string}/milestones/${string}/tasks` {
  return `${routes.projects}/${projectId}/milestones/${milestoneId}/tasks`;
}

/** Builds the canonical detail route for a task within a milestone. */
export function taskRoute(
  projectId: string,
  milestoneId: string,
  taskId: string,
): `${typeof routes.projects}/${string}/milestones/${string}/tasks/${string}` {
  return `${routes.projects}/${projectId}/milestones/${milestoneId}/tasks/${taskId}`;
}

/** Builds the canonical create route for a task within a milestone. */
export function newTaskRoute(
  projectId: string,
  milestoneId: string,
): `${typeof routes.projects}/${string}/milestones/${string}/tasks/new` {
  return `${routes.projects}/${projectId}/milestones/${milestoneId}/tasks/new`;
}

export function riskRoute(riskId: string): `${typeof routes.risks}/${string}` {
  return `${routes.risks}/${riskId}`;
}

export function decisionRoute(decisionId: string): `${typeof routes.decisions}/${string}` {
  return `${routes.decisions}/${decisionId}`;
}

export function vendorRoute(vendorId: string): `${typeof routes.vendors}/${string}` {
  return `${routes.vendors}/${vendorId}`;
}

export function documentRoute(documentId: string): `${typeof routes.documents}/${string}` {
  return `${routes.documents}/${documentId}`;
}

export function budgetRoute(budgetId: string): `${typeof routes.budgets}/${string}` {
  return `${routes.budgets}/${budgetId}`;
}

export type AppRoute = (typeof routes)[keyof typeof routes];

export interface NavigationItem {
  label: string;
  href: AppRoute;
  description?: string;
}

export const primaryNavigation: readonly NavigationItem[] = [
  {
    label: "Dashboard",
    href: routes.dashboard,
    description: "Workspace overview and operating metrics",
  },
  {
    label: "Companies",
    href: routes.companies,
    description: "Prospects, customers, partners, and vendors",
  },
  {
    label: "Contacts",
    href: routes.contacts,
    description: "Customer and partner contacts",
  },
  {
    label: "Opportunities",
    href: routes.opportunities,
    description: "Commercial pipeline and active deals",
  },
  {
    label: "Projects",
    href: routes.projects,
    description: "Scientific and operational projects",
  },
  {
    label: "Programs",
    href: routes.programs,
    description: "Portfolio-level program management",
  },
] as const;
