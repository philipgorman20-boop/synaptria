'use server';

import { routes } from '@synaptria/config';
import { revalidatePath } from 'next/cache';

import {
  toReviewRecommendationContext,
} from '../../../lib/recommendation-review-context';
import { getRecommendationReviewService } from '../../../lib/recommendation-review-service';
import { getRequestContext } from '../../../lib/request-context';

import {
  mapReviewRecommendationActionError,
  readReviewRecommendationFormValues,
} from './review-recommendation-form';

export async function acceptRecommendationAction(formData: FormData): Promise<void> {
  const values = readReviewRecommendationFormValues(formData);
  const context = await getRequestContext();

  try {
    await getRecommendationReviewService().acceptRecommendation(
      toReviewRecommendationContext(context),
      { recommendationId: values.recommendationId },
    );
  } catch (error) {
    const mapped = mapReviewRecommendationActionError(error);
    if (mapped !== undefined) {
      throw new Error(mapped.message);
    }

    throw error;
  }

  revalidatePath(routes.recommendations);
}

export async function dismissRecommendationAction(formData: FormData): Promise<void> {
  const values = readReviewRecommendationFormValues(formData);
  const context = await getRequestContext();

  try {
    await getRecommendationReviewService().dismissRecommendation(
      toReviewRecommendationContext(context),
      {
        recommendationId: values.recommendationId,
        ...(values.dismissalReason === undefined ? {} : { dismissalReason: values.dismissalReason }),
      },
    );
  } catch (error) {
    const mapped = mapReviewRecommendationActionError(error);
    if (mapped !== undefined) {
      throw new Error(mapped.message);
    }

    throw error;
  }

  revalidatePath(routes.recommendations);
}
