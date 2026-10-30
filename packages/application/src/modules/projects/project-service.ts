import type {
  CreateProjectContext,
  CreateProjectInput,
  CreateProjectOutput,
} from './create-project';
import { CreateProjectUseCase } from './create-project';
import type {
  DeleteProjectContext,
  DeleteProjectInput,
  DeleteProjectOutput,
} from './delete-project';
import { DeleteProjectUseCase } from './delete-project';
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
import type {
  UpdateProjectContext,
  UpdateProjectInput,
  UpdateProjectOutput,
} from './update-project';
import { UpdateProjectUseCase } from './update-project';

/** Application facade consumed by delivery mechanisms such as Next.js. */
export class ProjectService {
  constructor(
    private readonly createProjectUseCase: CreateProjectUseCase,
    private readonly listProjectsUseCase: ListProjectsUseCase,
    private readonly listProgramProjectsUseCase: ListProgramProjectsUseCase,
    private readonly getProjectUseCase: GetProjectUseCase,
    private readonly deleteProjectUseCase: DeleteProjectUseCase,
    private readonly updateProjectUseCase: UpdateProjectUseCase,
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

  deleteProject(
    context: DeleteProjectContext,
    input: DeleteProjectInput,
  ): Promise<DeleteProjectOutput> {
    return this.deleteProjectUseCase.execute(context, input);
  }

  updateProject(
    context: UpdateProjectContext,
    input: UpdateProjectInput,
  ): Promise<UpdateProjectOutput> {
    return this.updateProjectUseCase.execute(context, input);
  }
}
