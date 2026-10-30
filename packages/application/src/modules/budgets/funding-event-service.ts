import type { CreateFundingEventContext, CreateFundingEventInput, CreateFundingEventOutput } from './create-funding-event';
import { CreateFundingEventUseCase } from './create-funding-event';
import type { UpdateFundingEventContext, UpdateFundingEventInput, UpdateFundingEventOutput } from './update-funding-event';
import { UpdateFundingEventUseCase } from './update-funding-event';
import type { DeleteFundingEventContext, DeleteFundingEventInput, DeleteFundingEventOutput } from './delete-funding-event';
import { DeleteFundingEventUseCase } from './delete-funding-event';
import type { ListFundingEventsContext, ListFundingEventsOutput } from './list-funding-events';
import { ListFundingEventsUseCase } from './list-funding-events';

export class FundingEventService {
  constructor(
    private readonly createFundingEventUseCase: CreateFundingEventUseCase,
    private readonly updateFundingEventUseCase: UpdateFundingEventUseCase,
    private readonly deleteFundingEventUseCase: DeleteFundingEventUseCase,
    private readonly listFundingEventsUseCase: ListFundingEventsUseCase,
  ) {}

  createFundingEvent(context: CreateFundingEventContext, input: CreateFundingEventInput): Promise<CreateFundingEventOutput> {
    return this.createFundingEventUseCase.execute(context, input);
  }

  updateFundingEvent(context: UpdateFundingEventContext, input: UpdateFundingEventInput): Promise<UpdateFundingEventOutput> {
    return this.updateFundingEventUseCase.execute(context, input);
  }

  deleteFundingEvent(context: DeleteFundingEventContext, input: DeleteFundingEventInput): Promise<DeleteFundingEventOutput> {
    return this.deleteFundingEventUseCase.execute(context, input);
  }

  listFundingEvents(context: ListFundingEventsContext): Promise<ListFundingEventsOutput> {
    return this.listFundingEventsUseCase.execute(context);
  }
}
