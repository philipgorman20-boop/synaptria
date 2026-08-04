import type {
  CreateMilestoneContext,
  CreateMilestoneInput,
  CreateMilestoneOutput,
} from './create-milestone';
import { CreateMilestoneUseCase } from './create-milestone';
import type {
  GetMilestoneContext,
  GetMilestoneInput,
  GetMilestoneOutput,
} from './get-milestone';
import { GetMilestoneUseCase } from './get-milestone';
import type {
  ListMilestonesContext,
  ListMilestonesOutput,
} from './list-milestones';
import { ListMilestonesUseCase } from './list-milestones';
import type {
  ListProjectMilestonesContext,
  ListProjectMilestonesInput,
  ListProjectMilestonesOutput,
} from './list-project-milestones';
import { ListProjectMilestonesUseCase } from './list-project-milestones';

/** Application facade consumed by delivery mechanisms such as Next.js. */
export class MilestoneService {
  constructor(
    private readonly createMilestoneUseCase: CreateMilestoneUseCase,
    private readonly listMilestonesUseCase: ListMilestonesUseCase,
    private readonly listProjectMilestonesUseCase: ListProjectMilestonesUseCase,
    private readonly getMilestoneUseCase: GetMilestoneUseCase,
  ) {}

  createMilestone(
    context: CreateMilestoneContext,
    input: CreateMilestoneInput,
  ): Promise<CreateMilestoneOutput> {
    return this.createMilestoneUseCase.execute(context, input);
  }

  listMilestones(
    context: ListMilestonesContext,
  ): Promise<ListMilestonesOutput> {
    return this.listMilestonesUseCase.execute(context);
  }

  listProjectMilestones(
    context: ListProjectMilestonesContext,
    input: ListProjectMilestonesInput,
  ): Promise<ListProjectMilestonesOutput> {
    return this.listProjectMilestonesUseCase.execute(context, input);
  }

  getMilestone(
    context: GetMilestoneContext,
    input: GetMilestoneInput,
  ): Promise<GetMilestoneOutput> {
    return this.getMilestoneUseCase.execute(context, input);
  }
}
