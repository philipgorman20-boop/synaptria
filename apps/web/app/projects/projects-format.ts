import type { Program } from '@synaptria/domain/programs';
import type { ProjectPriority, ProjectStatus } from '@synaptria/domain/projects';
import { appConfig, programRoute, projectRoute, routes } from '@synaptria/config';
import { projectId, type ProgramId, type ProjectId } from '@synaptria/core';

const PROJECT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNED: 'Planned',
  ACTIVE: 'Active',
  ON_HOLD: 'On hold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const PROJECT_PRIORITY_LABELS: Record<ProjectPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export interface ProjectProgramOption {
  readonly id: string;
  readonly name: string;
  readonly code?: string;
}

export function formatProjectStatus(status: ProjectStatus): string {
  return PROJECT_STATUS_LABELS[status];
}

export function formatProjectPriority(priority: ProjectPriority): string {
  return PROJECT_PRIORITY_LABELS[priority];
}

export function formatProjectDate(date: Date): string {
  return new Intl.DateTimeFormat(appConfig.defaultLocale, {
    dateStyle: 'medium',
  }).format(date);
}

export function formatProjectPercentComplete(percentComplete: number): string {
  return `${percentComplete}%`;
}

export function getProjectDetailHref(projectId: ProjectId): string {
  return projectRoute(projectId);
}

export function getProjectsListHref(): string {
  return routes.projects;
}

export function parseProjectRouteParam(
  rawProjectId: string | undefined,
): ProjectId | null {
  if (typeof rawProjectId !== 'string') {
    return null;
  }

  const normalized = rawProjectId.trim();
  if (!PROJECT_ID_PATTERN.test(normalized)) {
    return null;
  }

  return projectId(normalized);
}

export type ProjectProgramDisplay =
  | {
      readonly kind: 'organization-level';
      readonly label: 'Organization-level';
    }
  | {
      readonly kind: 'linked';
      readonly label: string;
      readonly href: string;
    }
  | {
      readonly kind: 'unavailable';
      readonly label: 'Program unavailable';
    };

/**
 * Builds safe Program relationship display data for the project detail page.
 *
 * Pass `null` for `program` when the parent Program could not be loaded through
 * the authorized Program read use case.
 */
export function resolveProjectProgramDisplay(
  linkedProgramId: ProgramId | undefined,
  program: Program | null,
): ProjectProgramDisplay {
  if (linkedProgramId === undefined) {
    return { kind: 'organization-level', label: 'Organization-level' };
  }

  if (program === null || program.deletedAt !== undefined) {
    return { kind: 'unavailable', label: 'Program unavailable' };
  }

  return {
    kind: 'linked',
    label: formatProjectProgramOptionLabel({
      id: program.id,
      name: program.name,
      ...(program.code === undefined ? {} : { code: program.code }),
    }),
    href: programRoute(program.id),
  };
}

export function formatProjectProgramAssociation(
  programId: ProgramId | undefined,
): string {
  return programId === undefined ? 'Organization-level' : 'Program-linked';
}

export function shouldShowCreateProjectControl(
  canManageProjects: boolean,
): boolean {
  return canManageProjects;
}

/**
 * Maps authorized program list output into create-dialog select options.
 *
 * Tenant scoping and access control are enforced by ListProgramsUseCase before
 * this helper runs. The deletedAt filter here is defensive only and mirrors the
 * application layer's soft-delete exclusion.
 */
export function toProjectProgramOptions(
  programs: readonly Program[],
): readonly ProjectProgramOption[] {
  return programs
    .filter((program) => program.deletedAt === undefined)
    .map((program) => ({
      id: program.id,
      name: program.name,
      ...(program.code === undefined ? {} : { code: program.code }),
    }))
    .sort((left, right) =>
      left.name.localeCompare(right.name, 'en', { sensitivity: 'base' }),
    );
}

export function formatProjectProgramOptionLabel(
  option: ProjectProgramOption,
): string {
  return option.code === undefined ? option.name : `${option.name} (${option.code})`;
}
