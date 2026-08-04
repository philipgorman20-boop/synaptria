import type {
  CreateTaskContext,
  CreateTaskInput,
  CreateTaskOutput,
} from './create-task';
import { CreateTaskUseCase } from './create-task';
import type { GetTaskContext, GetTaskInput, GetTaskOutput } from './get-task';
import { GetTaskUseCase } from './get-task';
import type {
  ListMilestoneTasksContext,
  ListMilestoneTasksInput,
  ListMilestoneTasksOutput,
} from './list-milestone-tasks';
import { ListMilestoneTasksUseCase } from './list-milestone-tasks';
import type { ListTasksContext, ListTasksOutput } from './list-tasks';
import { ListTasksUseCase } from './list-tasks';

/** Application facade consumed by delivery mechanisms such as Next.js. */
export class TaskService {
  constructor(
    private readonly createTaskUseCase: CreateTaskUseCase,
    private readonly listTasksUseCase: ListTasksUseCase,
    private readonly listMilestoneTasksUseCase: ListMilestoneTasksUseCase,
    private readonly getTaskUseCase: GetTaskUseCase,
  ) {}

  createTask(
    context: CreateTaskContext,
    input: CreateTaskInput,
  ): Promise<CreateTaskOutput> {
    return this.createTaskUseCase.execute(context, input);
  }

  listTasks(context: ListTasksContext): Promise<ListTasksOutput> {
    return this.listTasksUseCase.execute(context);
  }

  listMilestoneTasks(
    context: ListMilestoneTasksContext,
    input: ListMilestoneTasksInput,
  ): Promise<ListMilestoneTasksOutput> {
    return this.listMilestoneTasksUseCase.execute(context, input);
  }

  getTask(context: GetTaskContext, input: GetTaskInput): Promise<GetTaskOutput> {
    return this.getTaskUseCase.execute(context, input);
  }
}
