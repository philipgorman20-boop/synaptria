import { ProviderError } from '@synaptria/ai';
import type { AIProviderResponse } from '@synaptria/ai';
import { validateJsonAgainstSchema } from '@synaptria/ai';

import { ApplicationError } from '../../../shared/application-error';
import {
  DAILY_BRIEFING_NARRATIVE_V0_JSON_SCHEMA,
  type DailyBriefingNarrativeV0StructuredOutput,
} from './schema';

export function mapDailyBriefingNarrativeProviderError(error: unknown): ApplicationError {
  if (error instanceof ApplicationError) {
    return error;
  }

  if (error instanceof ProviderError) {
    return new ApplicationError({
      code: 'VALIDATION_FAILED',
      message: error.message,
      cause: error,
      details: {
        providerErrorCode: error.code,
        ...(error.providerId === undefined ? {} : { providerId: error.providerId }),
      },
    });
  }

  return new ApplicationError({
    code: 'VALIDATION_FAILED',
    message: 'Daily Briefing narrative generation failed.',
    cause: error,
  });
}

export function assertSuccessfulDailyBriefingProviderResponse(
  response: AIProviderResponse,
): void {
  if (response.finishStatus !== 'completed') {
    throw new ApplicationError({
      code: 'VALIDATION_FAILED',
      message: `Daily Briefing narrative provider response finished with status "${response.finishStatus}".`,
      details: {
        finishStatus: response.finishStatus,
        ...(response.validation.issues === undefined
          ? {}
          : { validationIssues: response.validation.issues }),
      },
    });
  }

  if (!response.validation.valid) {
    throw new ApplicationError({
      code: 'VALIDATION_FAILED',
      message: 'Daily Briefing narrative provider response failed validation.',
      details: {
        ...(response.validation.issues === undefined
          ? {}
          : { validationIssues: response.validation.issues }),
      },
    });
  }

  if (response.output.mode !== 'structured') {
    throw new ApplicationError({
      code: 'VALIDATION_FAILED',
      message: 'Daily Briefing narrative requires structured provider output.',
    });
  }
}

export function parseDailyBriefingNarrativeStructuredOutput(
  data: unknown,
): DailyBriefingNarrativeV0StructuredOutput {
  const validation = validateJsonAgainstSchema(data, DAILY_BRIEFING_NARRATIVE_V0_JSON_SCHEMA);
  if (!validation.valid) {
    throw new ApplicationError({
      code: 'VALIDATION_FAILED',
      message: 'Daily Briefing narrative structured output failed schema validation.',
      details: {
        issues: validation.issues.map((issue) => `${issue.path}: ${issue.message}`),
      },
    });
  }

  return data as DailyBriefingNarrativeV0StructuredOutput;
}
