'use server';

import type { FundingEventId } from '@synaptria/core';
import { revalidatePath } from 'next/cache';
import { routes } from '@synaptria/config';

import { toUpdateFundingEventContext } from '../../../lib/funding-event-context';
import { getRequestContext } from '../../../lib/request-context';
import { getFundingEventService } from '../../../lib/budget-service';

import {
  mapUpdateFundingEventActionError,
  readUpdateFundingEventFormValues,
  validateUpdateFundingEventFormValues,
  type UpdateFundingEventActionState,
} from './update-funding-event-form';
import type { FundingEventType, FundingEventStatus } from '@synaptria/domain/budgets';

export async function updateFundingEventAction(
  eventId: FundingEventId,
  _previousState: UpdateFundingEventActionState,
  formData: FormData,
): Promise<UpdateFundingEventActionState> {
  const values = readUpdateFundingEventFormValues(formData);
  const validation = validateUpdateFundingEventFormValues(values);
  if (validation !== undefined) return validation;

  const amount = values.amount.length > 0 ? parseFloat(values.amount) : undefined;
  const receivedAt = values.receivedAt.length > 0 ? new Date(values.receivedAt) : values.receivedAt === '' ? null : undefined;
  const expectedAt = values.expectedAt.length > 0 ? new Date(values.expectedAt) : values.expectedAt === '' ? null : undefined;

  try {
    const context = await getRequestContext();
    await getFundingEventService().updateFundingEvent(toUpdateFundingEventContext(context), {
      fundingEventId: eventId,
      ...(values.name.length > 0 ? { name: values.name } : {}),
      ...(values.type.length > 0 ? { type: values.type as FundingEventType } : {}),
      ...(values.status.length > 0 ? { status: values.status as FundingEventStatus } : {}),
      ...(amount !== undefined ? { amount } : {}),
      ...(values.currency.length > 0 ? { currency: values.currency } : {}),
      ...(receivedAt !== undefined ? { receivedAt } : {}),
      ...(expectedAt !== undefined ? { expectedAt } : {}),
      investor: values.investor.length > 0 ? values.investor : null,
      notes: values.notes.length > 0 ? values.notes : null,
    });

    revalidatePath(routes.finance);
  } catch (error) {
    const mapped = mapUpdateFundingEventActionError(error, values);
    if (mapped !== undefined) return mapped;

    return { status: 'error', message: 'The funding event could not be updated. Please try again.', values };
  }

  return { status: 'success' };
}
