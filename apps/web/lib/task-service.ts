import {
  CreateTaskUseCase,
  GetTaskUseCase,
  ListMilestoneTasksUseCase,
  ListTasksUseCase,
  TaskService,
  type TaskTransactionRepositories,
  type TaskUnitOfWork,
} from '@synaptria/application';
import {
  createPersistenceRepositories,
  db,
  withTaskTransaction,
} from '@synaptria/database';

class PrismaTaskUnitOfWork implements TaskUnitOfWork {
  async execute<T>(
    operation: (repositories: TaskTransactionRepositories) => Promise<T>,
  ): Promise<T> {
    return withTaskTransaction(db, (repositories) => operation(repositories));
  }
}

const repositories = createPersistenceRepositories(db);
const taskUnitOfWork = new PrismaTaskUnitOfWork();

const taskService = new TaskService(
  new CreateTaskUseCase(taskUnitOfWork),
  new ListTasksUseCase(repositories.tasks),
  new ListMilestoneTasksUseCase(repositories.tasks, repositories.milestones),
  new GetTaskUseCase(repositories.tasks),
);

/** Shared application-service composition root for the Tasks module. */
export function getTaskService(): TaskService {
  return taskService;
}
