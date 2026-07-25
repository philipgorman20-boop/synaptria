import type {
  CreateProgramContext,
  CreateProgramInput,
  CreateProgramOutput,
} from './create-program';
import { CreateProgramUseCase } from './create-program';
import type {
  GetProgramContext,
  GetProgramInput,
  GetProgramOutput,
} from './get-program';
import { GetProgramUseCase } from './get-program';
import type { ListProgramsContext, ListProgramsOutput } from './list-programs';
import { ListProgramsUseCase } from './list-programs';

/** Application facade consumed by delivery mechanisms such as Next.js. */
export class ProgramService {
  constructor(
    private readonly createProgramUseCase: CreateProgramUseCase,
    private readonly listProgramsUseCase: ListProgramsUseCase,
    private readonly getProgramUseCase: GetProgramUseCase,
  ) {}

  createProgram(
    context: CreateProgramContext,
    input: CreateProgramInput,
  ): Promise<CreateProgramOutput> {
    return this.createProgramUseCase.execute(context, input);
  }

  listPrograms(context: ListProgramsContext): Promise<ListProgramsOutput> {
    return this.listProgramsUseCase.execute(context);
  }

  getProgram(
    context: GetProgramContext,
    input: GetProgramInput,
  ): Promise<GetProgramOutput> {
    return this.getProgramUseCase.execute(context, input);
  }
}
