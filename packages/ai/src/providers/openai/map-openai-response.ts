import type { AIProviderFinishStatus } from '../../constants';
import type { AIProviderResponse } from '../../types/contracts';
import type { OpenAIResponsesCreateResult } from './openai-client-boundary';

export function mapOpenAIResponseToProviderResponse(input: {
  readonly response: OpenAIResponsesCreateResult;
  readonly model: string;
  readonly durationMs: number;
  readonly outputMode: 'text' | 'structured';
}): AIProviderResponse {
  const finishStatus = mapFinishStatus(input.response);
  const text = extractOutputText(input.response);
  const usage = normalizeUsage(input.response);

  const validation =
    finishStatus === 'refused' || finishStatus === 'incomplete' || finishStatus === 'failed'
      ? {
          valid: false,
          issues: [describeFinishIssue(input.response, finishStatus)],
        }
      : {
          valid: finishStatus === 'completed',
        };

  return {
    provider: 'openai',
    model: input.response.model || input.model,
    output:
      input.outputMode === 'text'
        ? {
            mode: 'text',
            text: text ?? '',
          }
        : {
            mode: 'structured',
            data: null,
          },
    usage,
    latency: {
      durationMs: input.durationMs,
    },
    finishStatus,
    validation,
    metadata: {
      responseId: input.response.id,
      providerStatus: input.response.status,
      ...(input.response.incomplete_details?.reason === undefined
        ? {}
        : { incompleteReason: input.response.incomplete_details.reason }),
    },
  };
}

function mapFinishStatus(response: OpenAIResponsesCreateResult): AIProviderFinishStatus {
  if (containsRefusal(response)) {
    return 'refused';
  }

  switch (response.status) {
    case 'completed':
      return 'completed';
    case 'incomplete':
      return 'incomplete';
    case 'failed':
      return 'failed';
    default:
      return response.status === 'cancelled' ? 'failed' : 'incomplete';
  }
}

function containsRefusal(response: OpenAIResponsesCreateResult): boolean {
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === 'refusal' || content.refusal !== undefined) {
        return true;
      }
    }
  }

  return false;
}

function extractOutputText(response: OpenAIResponsesCreateResult): string | undefined {
  if (response.output_text !== undefined && response.output_text.length > 0) {
    return response.output_text;
  }

  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.text !== undefined && content.text.length > 0) {
        return content.text;
      }
    }
  }

  return undefined;
}

function normalizeUsage(response: OpenAIResponsesCreateResult) {
  return {
    ...(response.usage?.input_tokens === undefined
      ? {}
      : { inputTokens: response.usage.input_tokens }),
    ...(response.usage?.output_tokens === undefined
      ? {}
      : { outputTokens: response.usage.output_tokens }),
    ...(response.usage?.total_tokens === undefined
      ? {}
      : { totalTokens: response.usage.total_tokens }),
    ...(response.usage?.output_tokens_details?.reasoning_tokens === undefined
      ? {}
      : { reasoningTokens: response.usage.output_tokens_details.reasoning_tokens }),
  };
}

function describeFinishIssue(
  response: OpenAIResponsesCreateResult,
  finishStatus: AIProviderFinishStatus,
): string {
  if (finishStatus === 'refused') {
    return 'Provider refused to complete the request.';
  }

  if (finishStatus === 'incomplete') {
    return response.incomplete_details?.reason ?? 'Provider returned an incomplete response.';
  }

  return 'Provider failed to complete the request.';
}
