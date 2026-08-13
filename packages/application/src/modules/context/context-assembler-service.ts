import type { AssembleContextContext, AssembleContextInput, AssembleContextOutput } from './assemble-context';
import { AssembleContextUseCase } from './assemble-context';

export class ContextAssemblerService {
  constructor(private readonly assembleContextUseCase: AssembleContextUseCase) {}

  assembleContext(
    context: AssembleContextContext,
    input: AssembleContextInput,
  ): Promise<AssembleContextOutput> {
    return this.assembleContextUseCase.execute(context, input);
  }
}
