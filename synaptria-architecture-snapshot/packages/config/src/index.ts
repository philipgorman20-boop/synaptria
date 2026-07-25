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
