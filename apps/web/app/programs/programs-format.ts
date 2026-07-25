import type { ProgramPriority, ProgramStatus } from '@synaptria/domain/programs';
import { appConfig, programRoute } from '@synaptria/config';
import { programId, type ProgramId } from '@synaptria/core';

const PROGRAM_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PROGRAM_STATUS_LABELS: Record<ProgramStatus, string> = {
  CONCEPT: 'Concept',
  DISCOVERY: 'Discovery',
  PRECLINICAL: 'Preclinical',
  IND_ENABLING: 'IND enabling',
  CLINICAL: 'Clinical',
  PARTNERED: 'Partnered',
  ON_HOLD: 'On hold',
  COMPLETED: 'Completed',
  TERMINATED: 'Terminated',
};

const PROGRAM_PRIORITY_LABELS: Record<ProgramPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export function formatProgramStatus(status: ProgramStatus): string {
  return PROGRAM_STATUS_LABELS[status];
}

export function formatProgramPriority(priority: ProgramPriority): string {
  return PROGRAM_PRIORITY_LABELS[priority];
}

export function formatProgramDate(date: Date): string {
  return new Intl.DateTimeFormat(appConfig.defaultLocale, {
    dateStyle: 'medium',
  }).format(date);
}

export function getProgramDetailHref(programId: ProgramId): string {
  return programRoute(programId);
}

export function parseProgramRouteParam(
  rawProgramId: string | undefined,
): ProgramId | null {
  if (typeof rawProgramId !== 'string') {
    return null;
  }

  const normalized = rawProgramId.trim();
  if (!PROGRAM_ID_PATTERN.test(normalized)) {
    return null;
  }

  return programId(normalized);
}
