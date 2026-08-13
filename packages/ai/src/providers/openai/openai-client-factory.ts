import OpenAI from 'openai';

import type {
  OpenAIClientFactory,
  OpenAIResponsesClient,
  OpenAIResponsesCreateParams,
  OpenAIResponsesCreateResult,
} from './openai-client-boundary';

class OpenAISdkResponsesClient implements OpenAIResponsesClient {
  constructor(private readonly client: OpenAI) {}

  async create(params: OpenAIResponsesCreateParams): Promise<OpenAIResponsesCreateResult> {
    const response = await this.client.responses.create(params as never);
    return response as unknown as OpenAIResponsesCreateResult;
  }
}

export function createDefaultOpenAIClientFactory(): OpenAIClientFactory {
  return {
    create(apiKey: string): OpenAIResponsesClient {
      return new OpenAISdkResponsesClient(new OpenAI({ apiKey }));
    },
  };
}
