import type { MilestoneRepository } from '@synaptria/domain/milestones';

import type {
  MilestoneActionProposalState,
  MilestoneActionProposalStateReader,
} from './types';

function toScalarDate(value: Date | undefined): string | null {
  return value === undefined ? null : value.toISOString();
}

export class RepositoryMilestoneActionProposalStateReader
  implements MilestoneActionProposalStateReader
{
  constructor(private readonly milestones: MilestoneRepository) {}

  async findById(
    organizationId: Parameters<MilestoneActionProposalStateReader['findById']>[0],
    id: Parameters<MilestoneActionProposalStateReader['findById']>[1],
  ): Promise<MilestoneActionProposalState | null> {
    const milestone = await this.milestones.findById(organizationId, id);
    if (milestone === null) {
      return null;
    }

    return {
      milestoneId: milestone.id,
      organizationId: milestone.organizationId,
      status: milestone.status,
      priority: milestone.priority,
      plannedEndDate: toScalarDate(milestone.plannedEndDate),
      updatedAt: milestone.updatedAt.toISOString(),
    };
  }
}
