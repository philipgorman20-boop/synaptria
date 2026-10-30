'use server';

import type { FundingEventId } from '@synaptria/core';
import { revalidatePath } from 'next/cache';
import { routes } from '@synaptria/config';

import { toDeleteFundingEventContext } from '../../../lib/funding-event-context';
import { getRequestContext } from '../../../lib/request-context';
import { getFundingEventService } from '../../../lib/budget-service';

import type { DeleteFundingEventActionState } from './delete-funding-event-form';

export async function deleteFundingEventAction(
  eventId: FundingEventId,
  _previousState: DeleteFundingEventActionState,
): Promise<DeleteFundingEventActionState> {
  try {
    const context = await getRequestContext();
    await getFundingEventService().deleteFundingEvent(toDeleteFundingEventContext(context), { fundingEventId: eventId });
    revalidatePath(routes.finance);
  } catch {
    return { status: 'error', message: 'The funding event could not be deleted. Please try again.' };
  }

  return { status: 'idle' };
}
