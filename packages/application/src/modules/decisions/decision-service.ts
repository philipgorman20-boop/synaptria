import type { CreateDecisionContext, CreateDecisionInput, CreateDecisionOutput } from './create-decision';
import { CreateDecisionUseCase } from './create-decision';
import type { GetDecisionContext, GetDecisionInput, GetDecisionOutput } from './get-decision';
import { GetDecisionUseCase } from './get-decision';
import type { ListDecisionsContext, ListDecisionsOutput } from './list-decisions';
import { ListDecisionsUseCase } from './list-decisions';
import type { UpdateDecisionContext, UpdateDecisionInput, UpdateDecisionOutput } from './update-decision';
import { UpdateDecisionUseCase } from './update-decision';
import type { DeleteDecisionContext, DeleteDecisionInput, DeleteDecisionOutput } from './delete-decision';
import { DeleteDecisionUseCase } from './delete-decision';

export class DecisionService {
  constructor(
    private readonly createDecisionUseCase: CreateDecisionUseCase,
    private readonly listDecisionsUseCase: ListDecisionsUseCase,
    private readonly getDecisionUseCase: GetDecisionUseCase,
    private readonly updateDecisionUseCase: UpdateDecisionUseCase,
    private readonly deleteDecisionUseCase: DeleteDecisionUseCase,
  ) {}

  createDecision(context: CreateDecisionContext, input: CreateDecisionInput): Promise<CreateDecisionOutput> {
    return this.createDecisionUseCase.execute(context, input);
  }

  listDecisions(context: ListDecisionsContext): Promise<ListDecisionsOutput> {
    return this.listDecisionsUseCase.execute(context);
  }

  getDecision(context: GetDecisionContext, input: GetDecisionInput): Promise<GetDecisionOutput> {
    return this.getDecisionUseCase.execute(context, input);
  }

  updateDecision(context: UpdateDecisionContext, input: UpdateDecisionInput): Promise<UpdateDecisionOutput> {
    return this.updateDecisionUseCase.execute(context, input);
  }

  deleteDecision(context: DeleteDecisionContext, input: DeleteDecisionInput): Promise<DeleteDecisionOutput> {
    return this.deleteDecisionUseCase.execute(context, input);
  }
}
