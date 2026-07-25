import type {
  CreateProjectContext,
  CreateProjectInput,
  CreateProjectOutput,
} from './create-project';
import { CreateProjectUseCase } from './create-project';
import type {
  GetProjectContext,
  GetProjectInput,
  GetProjectOutput,
} from './get-project';
import { GetProjectUseCase } from './get-project';
import type {
  ListProgramProjectsContext,
  ListProgramProjectsInput,
  ListProgramProjectsOutput,
} from './list-program-projects';
import { ListProgramProjectsUseCase } from './list-program-projects';
import type { ListProjectsContext, ListProjectsOutput } from './list-projects';
import { ListProjectsUseCase } from './list-projects';

/** Application facade consumed by delivery mechanisms such as Next.js. */
export class ProjectService {
  constructor(
    private readonly createProjectUseCase: CreateProjectUseCase,
    private readonly listProjectsUseCase: ListProjectsUseCase,
    private readonly listProgramProjectsUseCase: ListProgramProjectsUseCase,
    private readonly getProjectUseCase: GetProjectUseCase,
  ) {}

  createProject(
    context: CreateProjectContext,
    input: CreateProjectInput,
  ): Promise<CreateProjectOutput> {
    return this.createProjectUseCase.execute(context, input);
  }

  listProjects(context: ListProjectsContext): Promise<ListProjectsOutput> {
    return this.listProjectsUseCase.execute(context);
  }

  listProgramProjects(
    context: ListProgramProjectsContext,
    input: ListProgramProjectsInput,
  ): Promise<ListProgramProjectsOutput> {
    return this.listProgramProjectsUseCase.execute(context, input);
  }

  getProject(
    context: GetProjectContext,
    input: GetProjectInput,
  ): Promise<GetProjectOutput> {
    return this.getProjectUseCase.execute(context, input);
  }
}
