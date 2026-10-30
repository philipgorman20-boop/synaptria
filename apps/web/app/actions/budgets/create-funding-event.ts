'use server';

import { revalidatePath } from 'next/cache';
import { routes } from '@synaptria/config';

import { toCreateFundingEventContext } from '../../../lib/funding-event-context';
import { getRequestContext } from '../../../lib/request-context';
import { getFundingEventService } from '../../../lib/budget-service';

import {
  mapCreateFundingEventActionError,
  readCreateFundingEventFormValues,
  validateCreateFundingEventFormValues,
  type CreateFundingEventActionState,
} from './create-funding-event-form';
import type { FundingEventType, FundingEventStatus } from '@synaptria/domain/budgets';

export async function createFundingEventAction(
  _previousState: CreateFundingEventActionState,
  formData: FormData,
): Promise<CreateFundingEventActionState> {
  const values = readCreateFundingEventFormValues(formData);
  const validation = validateCreateFundingEventFormValues(values);
  if (validation !== undefined) return validation;

  const amount = parseFloat(values.amount);
  const receivedAt = values.receivedAt.length > 0 ? new Date(values.receivedAt) : undefined;
  const expectedAt = values.expectedAt.length > 0 ? new Date(values.expectedAt) : undefined;

  try {
    const context = await getRequestContext();
    await getFundingEventService().createFundingEvent(toCreateFundingEventContext(context), {
      name: values.name,
      type: values.type as FundingEventType,
      ...(values.status.length > 0 ? { status: values.status as FundingEventStatus } : {}),
      amount,
      ...(values.currency.length > 0 ? { currency: values.currency } : {}),
      ...(receivedAt !== undefined ? { receivedAt } : {}),
      ...(expectedAt !== undefined ? { expectedAt } : {}),
      ...(values.investor.length > 0 ? { investor: values.investor } : {}),
      ...(values.notes.length > 0 ? { notes: values.notes } : {}),
    });

    revalidatePath(routes.finance);
  } catch (error) {
    const mapped = mapCreateFundingEventActionError(error, values);
    if (mapped !== undefined) return mapped;

    return { status: 'error', message: 'The funding event could not be created. Please try again.' };
  }

  return { status: 'idle' };
}
