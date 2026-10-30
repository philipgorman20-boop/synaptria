import type { CreateRiskContext, CreateRiskInput, CreateRiskOutput } from './create-risk';
import { CreateRiskUseCase } from './create-risk';
import type { GetRiskContext, GetRiskInput, GetRiskOutput } from './get-risk';
import { GetRiskUseCase } from './get-risk';
import type { ListRisksContext, ListRisksOutput } from './list-risks';
import { ListRisksUseCase } from './list-risks';
import type { UpdateRiskContext, UpdateRiskInput, UpdateRiskOutput } from './update-risk';
import { UpdateRiskUseCase } from './update-risk';
import type { DeleteRiskContext, DeleteRiskInput, DeleteRiskOutput } from './delete-risk';
import { DeleteRiskUseCase } from './delete-risk';

export class RiskService {
  constructor(
    private readonly createRiskUseCase: CreateRiskUseCase,
    private readonly listRisksUseCase: ListRisksUseCase,
    private readonly getRiskUseCase: GetRiskUseCase,
    private readonly updateRiskUseCase: UpdateRiskUseCase,
    private readonly deleteRiskUseCase: DeleteRiskUseCase,
  ) {}

  createRisk(context: CreateRiskContext, input: CreateRiskInput): Promise<CreateRiskOutput> {
    return this.createRiskUseCase.execute(context, input);
  }

  listRisks(context: ListRisksContext): Promise<ListRisksOutput> {
    return this.listRisksUseCase.execute(context);
  }

  getRisk(context: GetRiskContext, input: GetRiskInput): Promise<GetRiskOutput> {
    return this.getRiskUseCase.execute(context, input);
  }

  updateRisk(context: UpdateRiskContext, input: UpdateRiskInput): Promise<UpdateRiskOutput> {
    return this.updateRiskUseCase.execute(context, input);
  }

  deleteRisk(context: DeleteRiskContext, input: DeleteRiskInput): Promise<DeleteRiskOutput> {
    return this.deleteRiskUseCase.execute(context, input);
  }
}
