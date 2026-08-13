import type {
  MilestoneStatus,
  Priority,
  ProgramStatus,
  ProjectStatus,
  TaskStatus,
} from '@prisma/client';

import {
  MISSION_CONTROL_DEMO_CODE_PREFIX,
  MISSION_CONTROL_DEMO_PROGRAM_IDS,
  MISSION_CONTROL_DEMO_PROJECT_IDS,
} from './constants';
import type { DemoDateOffsetKind } from './dates';

export interface DemoProgramSpec {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly status: ProgramStatus;
  readonly priority: Priority;
  readonly scenario: string;
}

export interface DemoProjectSpec {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly programId: string;
  readonly status: ProjectStatus;
  readonly priority: Priority;
  readonly percentComplete: number;
  readonly scenario: string;
}

export interface DemoMilestoneSpec {
  readonly id: string;
  readonly projectId: string;
  readonly name: string;
  readonly status: MilestoneStatus;
  readonly priority: Priority;
  readonly plannedEndKind: DemoDateOffsetKind;
  readonly plannedEndSlot: number;
  readonly scenario: string;
}

export interface DemoTaskSpec {
  readonly id: string;
  readonly milestoneId: string;
  readonly name: string;
  readonly status: TaskStatus;
  readonly priority: Priority;
  readonly plannedEndKind?: DemoDateOffsetKind;
  readonly plannedEndSlot?: number;
  readonly scenario: string;
}

export interface DemoEventSpec {
  readonly id: string;
  readonly aggregateType: 'Program' | 'Project' | 'Milestone' | 'Task';
  readonly aggregateId: string;
  readonly eventType: string;
  readonly recentIndex: number;
  readonly scenario: string;
}

export const MISSION_CONTROL_DEMO_SCENARIO_CATEGORIES = [
  'critical_at_risk',
  'at_risk',
  'watch',
  'on_track',
  'on_track_quiet',
  'completed_project',
  'deep_overdue_milestone',
  'recent_overdue_milestone',
  'due_soon_milestone',
  'future_milestone',
  'completed_milestone',
  'cancelled_milestone',
  'blocked_overdue_task',
  'overdue_task',
  'blocked_task',
  'due_soon_critical_task',
  'due_soon_task',
  'future_task',
  'completed_task',
  'cancelled_task',
  'recent_activity',
] as const;

export function buildMissionControlDemoScenario(): {
  readonly programs: readonly DemoProgramSpec[];
  readonly projects: readonly DemoProjectSpec[];
  readonly milestones: readonly DemoMilestoneSpec[];
  readonly tasks: readonly DemoTaskSpec[];
  readonly events: readonly DemoEventSpec[];
} {
  const programs: DemoProgramSpec[] = [
    {
      id: MISSION_CONTROL_DEMO_PROGRAM_IDS.antibody,
      code: `${MISSION_CONTROL_DEMO_CODE_PREFIX}ABDP`,
      name: 'Antibody Discovery Platform',
      status: 'CLINICAL',
      priority: 'HIGH',
      scenario: 'portfolio_program',
    },
    {
      id: MISSION_CONTROL_DEMO_PROGRAM_IDS.mrna,
      code: `${MISSION_CONTROL_DEMO_CODE_PREFIX}MRNA`,
      name: 'mRNA Therapeutics',
      status: 'PRECLINICAL',
      priority: 'HIGH',
      scenario: 'portfolio_program',
    },
    {
      id: MISSION_CONTROL_DEMO_PROGRAM_IDS.operations,
      code: `${MISSION_CONTROL_DEMO_CODE_PREFIX}OPS`,
      name: 'Strategic Operations',
      status: 'DISCOVERY',
      priority: 'MEDIUM',
      scenario: 'portfolio_program',
    },
  ];

  const projects: DemoProjectSpec[] = [
    {
      id: MISSION_CONTROL_DEMO_PROJECT_IDS.criticalAtRisk,
      code: `${MISSION_CONTROL_DEMO_CODE_PREFIX}PROJ-A`,
      name: 'Project A — Critical / At Risk',
      programId: MISSION_CONTROL_DEMO_PROGRAM_IDS.antibody,
      status: 'ACTIVE',
      priority: 'CRITICAL',
      percentComplete: 42,
      scenario: 'critical_at_risk',
    },
    {
      id: MISSION_CONTROL_DEMO_PROJECT_IDS.atRisk,
      code: `${MISSION_CONTROL_DEMO_CODE_PREFIX}PROJ-B`,
      name: 'Project B — At Risk',
      programId: MISSION_CONTROL_DEMO_PROGRAM_IDS.antibody,
      status: 'ACTIVE',
      priority: 'HIGH',
      percentComplete: 55,
      scenario: 'at_risk',
    },
    {
      id: MISSION_CONTROL_DEMO_PROJECT_IDS.watch,
      code: `${MISSION_CONTROL_DEMO_CODE_PREFIX}PROJ-C`,
      name: 'Project C — Watch',
      programId: MISSION_CONTROL_DEMO_PROGRAM_IDS.mrna,
      status: 'ACTIVE',
      priority: 'MEDIUM',
      percentComplete: 36,
      scenario: 'watch',
    },
    {
      id: MISSION_CONTROL_DEMO_PROJECT_IDS.onTrack,
      code: `${MISSION_CONTROL_DEMO_CODE_PREFIX}PROJ-D`,
      name: 'Project D — On Track',
      programId: MISSION_CONTROL_DEMO_PROGRAM_IDS.mrna,
      status: 'ACTIVE',
      priority: 'MEDIUM',
      percentComplete: 68,
      scenario: 'on_track',
    },
    {
      id: MISSION_CONTROL_DEMO_PROJECT_IDS.onTrackQuiet,
      code: `${MISSION_CONTROL_DEMO_CODE_PREFIX}PROJ-E`,
      name: 'Project E — On Track / Quiet',
      programId: MISSION_CONTROL_DEMO_PROGRAM_IDS.operations,
      status: 'ACTIVE',
      priority: 'LOW',
      percentComplete: 22,
      scenario: 'on_track_quiet',
    },
    {
      id: MISSION_CONTROL_DEMO_PROJECT_IDS.completed,
      code: `${MISSION_CONTROL_DEMO_CODE_PREFIX}PROJ-F`,
      name: 'Project F — Completed',
      programId: MISSION_CONTROL_DEMO_PROGRAM_IDS.operations,
      status: 'COMPLETED',
      priority: 'LOW',
      percentComplete: 100,
      scenario: 'completed_project',
    },
  ];

  const milestones: DemoMilestoneSpec[] = [
    {
      id: '30000000-0000-4000-8000-000000000001',
      projectId: MISSION_CONTROL_DEMO_PROJECT_IDS.criticalAtRisk,
      name: 'Lead Optimization Gate',
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
      plannedEndKind: 'deep_overdue',
      plannedEndSlot: 0,
      scenario: 'deep_overdue_milestone',
    },
    {
      id: '30000000-0000-4000-8000-000000000002',
      projectId: MISSION_CONTROL_DEMO_PROJECT_IDS.criticalAtRisk,
      name: 'Toxicology Readout',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      plannedEndKind: 'future',
      plannedEndSlot: 1,
      scenario: 'future_milestone',
    },
    {
      id: '30000000-0000-4000-8000-000000000003',
      projectId: MISSION_CONTROL_DEMO_PROJECT_IDS.criticalAtRisk,
      name: 'CMC Scale-up Plan',
      status: 'PLANNED',
      priority: 'MEDIUM',
      plannedEndKind: 'future',
      plannedEndSlot: 2,
      scenario: 'future_milestone',
    },
    {
      id: '30000000-0000-4000-8000-000000000004',
      projectId: MISSION_CONTROL_DEMO_PROJECT_IDS.atRisk,
      name: 'IND-Enabling Study Start',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      plannedEndKind: 'recent_overdue',
      plannedEndSlot: 0,
      scenario: 'recent_overdue_milestone',
    },
    {
      id: '30000000-0000-4000-8000-000000000005',
      projectId: MISSION_CONTROL_DEMO_PROJECT_IDS.atRisk,
      name: 'Regulatory Strategy Review',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      plannedEndKind: 'due_soon',
      plannedEndSlot: 1,
      scenario: 'due_soon_milestone',
    },
    {
      id: '30000000-0000-4000-8000-000000000006',
      projectId: MISSION_CONTROL_DEMO_PROJECT_IDS.watch,
      name: 'Formulation Pilot Batch',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      plannedEndKind: 'due_soon',
      plannedEndSlot: 0,
      scenario: 'due_soon_milestone',
    },
    {
      id: '30000000-0000-4000-8000-000000000007',
      projectId: MISSION_CONTROL_DEMO_PROJECT_IDS.watch,
      name: 'Stability Study Launch',
      status: 'PLANNED',
      priority: 'MEDIUM',
      plannedEndKind: 'future',
      plannedEndSlot: 3,
      scenario: 'future_milestone',
    },
    {
      id: '30000000-0000-4000-8000-000000000008',
      projectId: MISSION_CONTROL_DEMO_PROJECT_IDS.onTrack,
      name: 'Phase 1 Protocol Finalization',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      plannedEndKind: 'future',
      plannedEndSlot: 4,
      scenario: 'future_milestone',
    },
    {
      id: '30000000-0000-4000-8000-000000000009',
      projectId: MISSION_CONTROL_DEMO_PROJECT_IDS.onTrack,
      name: 'Site Activation Wave 1',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      plannedEndKind: 'completed_past',
      plannedEndSlot: 0,
      scenario: 'completed_milestone',
    },
    {
      id: '30000000-0000-4000-8000-000000000010',
      projectId: MISSION_CONTROL_DEMO_PROJECT_IDS.onTrackQuiet,
      name: 'Vendor Qualification',
      status: 'PLANNED',
      priority: 'LOW',
      plannedEndKind: 'future',
      plannedEndSlot: 5,
      scenario: 'future_milestone',
    },
    {
      id: '30000000-0000-4000-8000-000000000011',
      projectId: MISSION_CONTROL_DEMO_PROJECT_IDS.onTrackQuiet,
      name: 'Budget Reconciliation',
      status: 'IN_PROGRESS',
      priority: 'LOW',
      plannedEndKind: 'future',
      plannedEndSlot: 6,
      scenario: 'future_milestone',
    },
    {
      id: '30000000-0000-4000-8000-000000000012',
      projectId: MISSION_CONTROL_DEMO_PROJECT_IDS.completed,
      name: 'Legacy Data Migration',
      status: 'COMPLETED',
      priority: 'LOW',
      plannedEndKind: 'completed_past',
      plannedEndSlot: 1,
      scenario: 'completed_milestone',
    },
    {
      id: '30000000-0000-4000-8000-000000000013',
      projectId: MISSION_CONTROL_DEMO_PROJECT_IDS.completed,
      name: 'Archive Validation',
      status: 'CANCELLED',
      priority: 'LOW',
      plannedEndKind: 'future',
      plannedEndSlot: 7,
      scenario: 'cancelled_milestone',
    },
  ];

  const tasks: DemoTaskSpec[] = [
    // Project A
    {
      id: '40000000-0000-4000-8000-000000000001',
      milestoneId: '30000000-0000-4000-8000-000000000001',
      name: 'Resolve assay transfer blocker',
      status: 'BLOCKED',
      priority: 'CRITICAL',
      plannedEndKind: 'deep_overdue',
      plannedEndSlot: 1,
      scenario: 'blocked_overdue_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000002',
      milestoneId: '30000000-0000-4000-8000-000000000001',
      name: 'Update potency model',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      plannedEndKind: 'recent_overdue',
      plannedEndSlot: 0,
      scenario: 'overdue_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000003',
      milestoneId: '30000000-0000-4000-8000-000000000001',
      name: 'Finalize candidate ranking memo',
      status: 'TODO',
      priority: 'HIGH',
      plannedEndKind: 'deep_overdue',
      plannedEndSlot: 2,
      scenario: 'overdue_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000004',
      milestoneId: '30000000-0000-4000-8000-000000000002',
      name: 'Hold vendor capacity review',
      status: 'BLOCKED',
      priority: 'MEDIUM',
      plannedEndKind: 'future',
      plannedEndSlot: 0,
      scenario: 'blocked_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000005',
      milestoneId: '30000000-0000-4000-8000-000000000002',
      name: 'Draft tox study protocol',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      plannedEndKind: 'due_soon',
      plannedEndSlot: 0,
      scenario: 'due_soon_critical_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000006',
      milestoneId: '30000000-0000-4000-8000-000000000002',
      name: 'Align CMC timeline with tox',
      status: 'TODO',
      priority: 'MEDIUM',
      plannedEndKind: 'due_soon',
      plannedEndSlot: 2,
      scenario: 'due_soon_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000007',
      milestoneId: '30000000-0000-4000-8000-000000000003',
      name: 'Prepare scale-up checklist',
      status: 'TODO',
      priority: 'MEDIUM',
      plannedEndKind: 'future',
      plannedEndSlot: 1,
      scenario: 'future_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000008',
      milestoneId: '30000000-0000-4000-8000-000000000003',
      name: 'Confirm raw material suppliers',
      status: 'COMPLETED',
      priority: 'LOW',
      plannedEndKind: 'completed_past',
      plannedEndSlot: 2,
      scenario: 'completed_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000009',
      milestoneId: '30000000-0000-4000-8000-000000000001',
      name: 'Review historical batch records',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      plannedEndKind: 'completed_past',
      plannedEndSlot: 3,
      scenario: 'completed_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000010',
      milestoneId: '30000000-0000-4000-8000-000000000002',
      name: 'Schedule tox kickoff',
      status: 'TODO',
      priority: 'LOW',
      plannedEndKind: 'future',
      plannedEndSlot: 2,
      scenario: 'future_task',
    },
    // Project B
    {
      id: '40000000-0000-4000-8000-000000000011',
      milestoneId: '30000000-0000-4000-8000-000000000004',
      name: 'Complete GLP study initiation',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      plannedEndKind: 'recent_overdue',
      plannedEndSlot: 1,
      scenario: 'overdue_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000012',
      milestoneId: '30000000-0000-4000-8000-000000000004',
      name: 'Update study tracker',
      status: 'TODO',
      priority: 'MEDIUM',
      plannedEndKind: 'due_soon',
      plannedEndSlot: 1,
      scenario: 'due_soon_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000013',
      milestoneId: '30000000-0000-4000-8000-000000000005',
      name: 'Draft FDA meeting questions',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      plannedEndKind: 'due_soon',
      plannedEndSlot: 3,
      scenario: 'due_soon_critical_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000014',
      milestoneId: '30000000-0000-4000-8000-000000000005',
      name: 'Collect cross-functional feedback',
      status: 'TODO',
      priority: 'MEDIUM',
      plannedEndKind: 'future',
      plannedEndSlot: 3,
      scenario: 'future_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000015',
      milestoneId: '30000000-0000-4000-8000-000000000004',
      name: 'Archive obsolete protocol draft',
      status: 'COMPLETED',
      priority: 'LOW',
      plannedEndKind: 'completed_past',
      plannedEndSlot: 4,
      scenario: 'completed_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000016',
      milestoneId: '30000000-0000-4000-8000-000000000005',
      name: 'Confirm regulatory owner',
      status: 'BLOCKED',
      priority: 'MEDIUM',
      plannedEndKind: 'future',
      plannedEndSlot: 4,
      scenario: 'blocked_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000017',
      milestoneId: '30000000-0000-4000-8000-000000000004',
      name: 'Validate CRO data room access',
      status: 'TODO',
      priority: 'LOW',
      plannedEndKind: 'future',
      plannedEndSlot: 5,
      scenario: 'future_task',
    },
    // Project C
    {
      id: '40000000-0000-4000-8000-000000000018',
      milestoneId: '30000000-0000-4000-8000-000000000006',
      name: 'Run pilot batch release testing',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      plannedEndKind: 'due_soon',
      plannedEndSlot: 4,
      scenario: 'due_soon_critical_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000019',
      milestoneId: '30000000-0000-4000-8000-000000000006',
      name: 'Prepare stability protocol',
      status: 'TODO',
      priority: 'MEDIUM',
      plannedEndKind: 'due_soon',
      plannedEndSlot: 5,
      scenario: 'due_soon_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000020',
      milestoneId: '30000000-0000-4000-8000-000000000007',
      name: 'Reserve stability chambers',
      status: 'TODO',
      priority: 'MEDIUM',
      plannedEndKind: 'future',
      plannedEndSlot: 6,
      scenario: 'future_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000021',
      milestoneId: '30000000-0000-4000-8000-000000000006',
      name: 'Review formulation notebook',
      status: 'COMPLETED',
      priority: 'LOW',
      plannedEndKind: 'completed_past',
      plannedEndSlot: 5,
      scenario: 'completed_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000022',
      milestoneId: '30000000-0000-4000-8000-000000000007',
      name: 'Confirm LIMS sample IDs',
      status: 'IN_PROGRESS',
      priority: 'LOW',
      plannedEndKind: 'future',
      plannedEndSlot: 7,
      scenario: 'future_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000023',
      milestoneId: '30000000-0000-4000-8000-000000000007',
      name: 'Retire superseded SOP reference',
      status: 'CANCELLED',
      priority: 'LOW',
      scenario: 'cancelled_task',
    },
    // Project D
    {
      id: '40000000-0000-4000-8000-000000000024',
      milestoneId: '30000000-0000-4000-8000-000000000008',
      name: 'Finalize inclusion/exclusion criteria',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      plannedEndKind: 'future',
      plannedEndSlot: 8,
      scenario: 'future_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000025',
      milestoneId: '30000000-0000-4000-8000-000000000008',
      name: 'Align protocol with medical monitor',
      status: 'TODO',
      priority: 'MEDIUM',
      plannedEndKind: 'future',
      plannedEndSlot: 9,
      scenario: 'future_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000026',
      milestoneId: '30000000-0000-4000-8000-000000000009',
      name: 'Close site activation checklist',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      plannedEndKind: 'completed_past',
      plannedEndSlot: 6,
      scenario: 'completed_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000027',
      milestoneId: '30000000-0000-4000-8000-000000000009',
      name: 'Upload activation evidence',
      status: 'COMPLETED',
      priority: 'LOW',
      plannedEndKind: 'completed_past',
      plannedEndSlot: 7,
      scenario: 'completed_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000028',
      milestoneId: '30000000-0000-4000-8000-000000000008',
      name: 'Schedule investigator meeting',
      status: 'TODO',
      priority: 'LOW',
      plannedEndKind: 'future',
      plannedEndSlot: 10,
      scenario: 'future_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000029',
      milestoneId: '30000000-0000-4000-8000-000000000008',
      name: 'Confirm pharmacy manual draft',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      plannedEndKind: 'future',
      plannedEndSlot: 11,
      scenario: 'future_task',
    },
    // Project E
    {
      id: '40000000-0000-4000-8000-000000000030',
      milestoneId: '30000000-0000-4000-8000-000000000010',
      name: 'Issue vendor audit questionnaire',
      status: 'TODO',
      priority: 'LOW',
      plannedEndKind: 'future',
      plannedEndSlot: 12,
      scenario: 'future_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000031',
      milestoneId: '30000000-0000-4000-8000-000000000011',
      name: 'Reconcile Q2 spend categories',
      status: 'IN_PROGRESS',
      priority: 'LOW',
      plannedEndKind: 'future',
      plannedEndSlot: 13,
      scenario: 'future_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000032',
      milestoneId: '30000000-0000-4000-8000-000000000010',
      name: 'Archive signed vendor attestation',
      status: 'COMPLETED',
      priority: 'LOW',
      plannedEndKind: 'completed_past',
      plannedEndSlot: 8,
      scenario: 'completed_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000033',
      milestoneId: '30000000-0000-4000-8000-000000000011',
      name: 'Publish budget baseline note',
      status: 'TODO',
      priority: 'MEDIUM',
      plannedEndKind: 'future',
      plannedEndSlot: 14,
      scenario: 'future_task',
    },
    // Project F
    {
      id: '40000000-0000-4000-8000-000000000034',
      milestoneId: '30000000-0000-4000-8000-000000000012',
      name: 'Validate migrated dataset',
      status: 'COMPLETED',
      priority: 'LOW',
      plannedEndKind: 'completed_past',
      plannedEndSlot: 9,
      scenario: 'completed_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000035',
      milestoneId: '30000000-0000-4000-8000-000000000012',
      name: 'Sign migration completion memo',
      status: 'COMPLETED',
      priority: 'MEDIUM',
      plannedEndKind: 'completed_past',
      plannedEndSlot: 10,
      scenario: 'completed_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000036',
      milestoneId: '30000000-0000-4000-8000-000000000013',
      name: 'Archive validation checklist',
      status: 'CANCELLED',
      priority: 'LOW',
      scenario: 'cancelled_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000037',
      milestoneId: '30000000-0000-4000-8000-000000000012',
      name: 'Close migration action items',
      status: 'COMPLETED',
      priority: 'LOW',
      plannedEndKind: 'completed_past',
      plannedEndSlot: 11,
      scenario: 'completed_task',
    },
    {
      id: '40000000-0000-4000-8000-000000000038',
      milestoneId: '30000000-0000-4000-8000-000000000013',
      name: 'Retire archive workspace',
      status: 'COMPLETED',
      priority: 'LOW',
      plannedEndKind: 'completed_past',
      plannedEndSlot: 12,
      scenario: 'completed_task',
    },
  ];

  const events: DemoEventSpec[] = [
    ...programs.map((program, index) => ({
      id: `50000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
      aggregateType: 'Program' as const,
      aggregateId: program.id,
      eventType: 'program.created',
      recentIndex: index,
      scenario: 'recent_activity',
    })),
    ...projects.map((project, index) => ({
      id: `50000000-0000-4000-8000-${String(index + 4).padStart(12, '0')}`,
      aggregateType: 'Project' as const,
      aggregateId: project.id,
      eventType: 'project.created',
      recentIndex: index + 3,
      scenario: 'recent_activity',
    })),
    {
      id: '50000000-0000-4000-8000-000000000010',
      aggregateType: 'Project',
      aggregateId: MISSION_CONTROL_DEMO_PROJECT_IDS.criticalAtRisk,
      eventType: 'project.updated',
      recentIndex: 0,
      scenario: 'recent_activity',
    },
    {
      id: '50000000-0000-4000-8000-000000000011',
      aggregateType: 'Project',
      aggregateId: MISSION_CONTROL_DEMO_PROJECT_IDS.atRisk,
      eventType: 'project.updated',
      recentIndex: 1,
      scenario: 'recent_activity',
    },
    {
      id: '50000000-0000-4000-8000-000000000012',
      aggregateType: 'Project',
      aggregateId: MISSION_CONTROL_DEMO_PROJECT_IDS.watch,
      eventType: 'project.updated',
      recentIndex: 2,
      scenario: 'recent_activity',
    },
    ...milestones.slice(0, 8).map((milestone, index) => ({
      id: `50000000-0000-4000-8000-${String(index + 13).padStart(12, '0')}`,
      aggregateType: 'Milestone' as const,
      aggregateId: milestone.id,
      eventType: 'milestone.created',
      recentIndex: index + 4,
      scenario: 'recent_activity',
    })),
    ...tasks.slice(0, 10).map((task, index) => ({
      id: `50000000-0000-4000-8000-${String(index + 21).padStart(12, '0')}`,
      aggregateType: 'Task' as const,
      aggregateId: task.id,
      eventType: 'task.created',
      recentIndex: index + 6,
      scenario: 'recent_activity',
    })),
    {
      id: '50000000-0000-4000-8000-000000000031',
      aggregateType: 'Task',
      aggregateId: '40000000-0000-4000-8000-000000000001',
      eventType: 'task.updated',
      recentIndex: 3,
      scenario: 'recent_activity',
    },
    {
      id: '50000000-0000-4000-8000-000000000032',
      aggregateType: 'Milestone',
      aggregateId: '30000000-0000-4000-8000-000000000001',
      eventType: 'milestone.updated',
      recentIndex: 4,
      scenario: 'recent_activity',
    },
  ];

  return { programs, projects, milestones, tasks, events };
}

export function summarizeMissionControlDemoScenario(
  scenario: ReturnType<typeof buildMissionControlDemoScenario>,
): readonly string[] {
  const categories = new Set<string>(MISSION_CONTROL_DEMO_SCENARIO_CATEGORIES);
  for (const entity of [
    ...scenario.programs,
    ...scenario.projects,
    ...scenario.milestones,
    ...scenario.tasks,
    ...scenario.events,
  ]) {
    categories.add(entity.scenario);
  }
  return [...categories].sort();
}
