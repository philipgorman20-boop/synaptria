import type { OrganizationId } from '@synaptria/core';
import type { MilestonePriority, MilestoneStatus } from '@synaptria/domain/milestones';
import type { ProjectPriority, ProjectStatus } from '@synaptria/domain/projects';
import type { Task, TaskStatus } from '@synaptria/domain/tasks';

import type {
  MissionControlAttentionType,
  MissionControlProjectHealthState,
  MissionControlRestrictedSlice,
  MissionControlSeverity,
} from './constants';

export type { MissionControlRestrictedSlice } from './constants';

export interface MissionControlEntityReference {
  readonly entityType: 'Program' | 'Project' | 'Milestone' | 'Task';
  readonly entityId: string;
}

export interface MissionControlSummary {
  readonly activePrograms: number;
  readonly activeProjects: number;
  readonly openMilestones: number;
  readonly openTasks: number;
  readonly overdueMilestones: number;
  readonly overdueTasks: number;
  readonly blockedTasks: number;
  readonly completedTasks: number;
  readonly recentActivityCount: number;
}

export interface MissionControlAttentionItem {
  readonly type: MissionControlAttentionType;
  readonly severity: MissionControlSeverity;
  readonly entity: MissionControlEntityReference;
  readonly title: string;
  readonly reason: string;
  readonly dueDate?: string;
  readonly projectId?: string;
  readonly milestoneId?: string;
  readonly eventId?: string;
}

export interface MissionControlProjectHealth {
  readonly projectId: string;
  readonly projectName: string;
  readonly status: ProjectStatus;
  readonly priority: ProjectPriority;
  readonly openMilestones: number;
  readonly overdueMilestones: number;
  readonly openTasks: number;
  readonly overdueTasks: number;
  readonly blockedTasks: number;
  readonly dueSoonMilestones: number;
  readonly dueSoonTasks: number;
  readonly recentEventCount: number;
  readonly nextMilestoneDueDate?: string;
  readonly attentionSeverity: MissionControlSeverity;
  readonly healthState: MissionControlProjectHealthState;
}

export interface MissionControlMilestoneSignal {
  readonly milestoneId: string;
  readonly milestoneName: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly status: MilestoneStatus;
  readonly plannedEndDate?: string;
  readonly overdue: boolean;
  readonly dueSoon: boolean;
  readonly openTaskCount: number;
  readonly blockedTaskCount: number;
  readonly overdueTaskCount: number;
}

export interface MissionControlTaskSignal {
  readonly taskId: string;
  readonly taskName: string;
  readonly milestoneId: string;
  readonly milestoneName: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly status: TaskStatus;
  readonly priority: Task['priority'];
  readonly plannedEndDate?: string;
  readonly overdue: boolean;
  readonly dueSoon: boolean;
  readonly blocked: boolean;
}

export interface MissionControlRecentActivityItem {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly occurredAt: string;
}

export interface MissionControlSnapshotMetadata {
  readonly deterministic: true;
  readonly restrictedSlices: readonly MissionControlRestrictedSlice[];
}

export interface MissionControlSnapshot {
  readonly generatedAt: Date;
  readonly organization: {
    readonly organizationId: OrganizationId;
  };
  readonly summary: MissionControlSummary;
  readonly attentionItems: readonly MissionControlAttentionItem[];
  readonly projectHealth: readonly MissionControlProjectHealth[];
  readonly milestoneSignals: readonly MissionControlMilestoneSignal[];
  readonly taskSignals: readonly MissionControlTaskSignal[];
  readonly recentActivity: readonly MissionControlRecentActivityItem[];
  readonly metadata: MissionControlSnapshotMetadata;
}
