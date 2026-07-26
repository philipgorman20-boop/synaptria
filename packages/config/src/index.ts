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
