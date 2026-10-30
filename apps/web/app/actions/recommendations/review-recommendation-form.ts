import { ApplicationError } from '@synaptria/application';
import { AuthorizationDeniedError } from '@synaptria/core/errors';

export interface ReviewRecommendationFormValues {
  readonly recommendationId: string;
  readonly dismissalReason?: string;
}

export function readReviewRecommendationFormValues(
  formData: FormData,
): ReviewRecommendationFormValues {
  const recommendationId = formData.get('recommendationId');
  const dismissalReasonRaw = formData.get('dismissalReason');

  if (typeof recommendationId !== 'string' || recommendationId.trim().length === 0) {
    throw new ApplicationError({
      code: 'VALIDATION_FAILED',
      message: 'A recommendation ID is required.',
      details: { field: 'recommendationId' },
    });
  }

  return {
    recommendationId: recommendationId.trim(),
    ...(typeof dismissalReasonRaw === 'string' && dismissalReasonRaw.trim().length > 0
      ? { dismissalReason: dismissalReasonRaw.trim() }
      : {}),
  };
}

export function mapReviewRecommendationActionError(
  error: unknown,
): { message: string } | undefined {
  if (error instanceof AuthorizationDeniedError) {
    return {
      message: 'You do not have permission to review recommendations.',
    };
  }

  if (error instanceof ApplicationError) {
    return { message: error.message };
  }

  return undefined;
}
