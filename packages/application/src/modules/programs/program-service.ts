import type {
  CreateProgramContext,
  CreateProgramInput,
  CreateProgramOutput,
} from './create-program';
import { CreateProgramUseCase } from './create-program';
import type {
  DeleteProgramContext,
  DeleteProgramInput,
  DeleteProgramOutput,
} from './delete-program';
import { DeleteProgramUseCase } from './delete-program';
import type {
  GetProgramContext,
  GetProgramInput,
  GetProgramOutput,
} from './get-program';
import { GetProgramUseCase } from './get-program';
import type { ListProgramsContext, ListProgramsOutput } from './list-programs';
import { ListProgramsUseCase } from './list-programs';
import type {
  UpdateProgramContext,
  UpdateProgramInput,
  UpdateProgramOutput,
} from './update-program';
import { UpdateProgramUseCase } from './update-program';

/** Application facade consumed by delivery mechanisms such as Next.js. */
export class ProgramService {
  constructor(
    private readonly createProgramUseCase: CreateProgramUseCase,
    private readonly listProgramsUseCase: ListProgramsUseCase,
    private readonly getProgramUseCase: GetProgramUseCase,
    private readonly deleteProgramUseCase: DeleteProgramUseCase,
    private readonly updateProgramUseCase: UpdateProgramUseCase,
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

  deleteProgram(
    context: DeleteProgramContext,
    input: DeleteProgramInput,
  ): Promise<DeleteProgramOutput> {
    return this.deleteProgramUseCase.execute(context, input);
  }

  updateProgram(
    context: UpdateProgramContext,
    input: UpdateProgramInput,
  ): Promise<UpdateProgramOutput> {
    return this.updateProgramUseCase.execute(context, input);
  }
}
