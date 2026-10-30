import type { GetActionProposalsContext } from './get-action-proposals';
import { GetActionProposalUseCase, GetActionProposalsUseCase } from './get-action-proposals';

export class ActionProposalsService {
  constructor(
    private readonly getActionProposalsUseCase: GetActionProposalsUseCase,
    private readonly getActionProposalUseCase: GetActionProposalUseCase,
  ) {}

  getActionProposals(context: GetActionProposalsContext) {
    return this.getActionProposalsUseCase.execute(context);
  }

  getActionProposal(context: GetActionProposalsContext, recommendationId: string) {
    return this.getActionProposalUseCase.execute(context, recommendationId);
  }
}

export type { GetActionProposalsContext };
