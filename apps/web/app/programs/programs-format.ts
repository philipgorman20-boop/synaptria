import type { ProgramPriority, ProgramStatus } from '@synaptria/domain/programs';
import { appConfig, programRoute } from '@synaptria/config';
import type { ProgramId } from '@synaptria/core';

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
