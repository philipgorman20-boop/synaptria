import type { Program } from '@synaptria/domain/programs';
import type { ProjectPriority, ProjectStatus } from '@synaptria/domain/projects';
import { appConfig, projectRoute } from '@synaptria/config';
import type { ProgramId, ProjectId } from '@synaptria/core';

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
