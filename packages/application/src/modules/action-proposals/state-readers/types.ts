import type { OrganizationId } from '@synaptria/core';
import type { MilestoneId, TaskId } from '@synaptria/core';
import type { ProjectId } from '@synaptria/core';
import type { ActionProposalScalarValue } from '@synaptria/domain/action-proposals';

export interface TaskActionProposalState {
  readonly taskId: TaskId;
  readonly organizationId: OrganizationId;
  readonly status: ActionProposalScalarValue;
  readonly priority: ActionProposalScalarValue;
  readonly plannedEndDate: ActionProposalScalarValue;
  readonly updatedAt: ActionProposalScalarValue;
}

export interface MilestoneActionProposalState {
  readonly milestoneId: MilestoneId;
  readonly organizationId: OrganizationId;
  readonly status: ActionProposalScalarValue;
  readonly priority: ActionProposalScalarValue;
  readonly plannedEndDate: ActionProposalScalarValue;
  readonly updatedAt: ActionProposalScalarValue;
}

export interface ProjectActionProposalState {
  readonly projectId: ProjectId;
  readonly organizationId: OrganizationId;
  readonly status: ActionProposalScalarValue;
  readonly priority: ActionProposalScalarValue;
  readonly targetEndDate: ActionProposalScalarValue;
  readonly updatedAt: ActionProposalScalarValue;
}

export interface TaskActionProposalStateReader {
  findById(
    organizationId: OrganizationId,
    taskId: TaskId,
  ): Promise<TaskActionProposalState | null>;
}

export interface MilestoneActionProposalStateReader {
  findById(
    organizationId: OrganizationId,
    milestoneId: MilestoneId,
  ): Promise<MilestoneActionProposalState | null>;
}

export interface ProjectActionProposalStateReader {
  findById(
    organizationId: OrganizationId,
    projectId: ProjectId,
  ): Promise<ProjectActionProposalState | null>;
}

export interface ActionProposalStateReaders {
  readonly tasks: TaskActionProposalStateReader;
  readonly milestones: MilestoneActionProposalStateReader;
  readonly projects: ProjectActionProposalStateReader;
}
