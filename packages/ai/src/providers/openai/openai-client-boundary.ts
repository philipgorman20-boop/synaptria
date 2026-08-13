/** Internal OpenAI Responses API boundary for testability without network access. */

export interface OpenAIResponsesTextFormat {
  readonly type: 'json_schema';
  readonly name: string;
  readonly strict: boolean;
  readonly schema: Record<string, unknown>;
}

export interface OpenAIResponsesCreateParams {
  readonly model: string;
  readonly input: string;
  readonly instructions?: string;
  readonly store: false;
  readonly text?: {
    readonly format: OpenAIResponsesTextFormat;
  };
  readonly temperature?: number;
  readonly max_output_tokens?: number;
}

export interface OpenAIResponsesUsage {
  readonly input_tokens?: number;
  readonly output_tokens?: number;
  readonly total_tokens?: number;
}

export interface OpenAIResponsesCreateResult {
  readonly id: string;
  readonly model: string;
  readonly status: string;
  readonly output_text?: string;
  readonly output?: readonly {
    readonly type: string;
    readonly content?: readonly {
      readonly type: string;
      readonly text?: string;
      readonly refusal?: string;
    }[];
  }[];
  readonly usage?: OpenAIResponsesUsage;
  readonly incomplete_details?: {
    readonly reason?: string;
  };
}

export interface OpenAIResponsesClient {
  create(params: OpenAIResponsesCreateParams): Promise<OpenAIResponsesCreateResult>;
}

export interface OpenAIClientFactory {
  create(apiKey: string): OpenAIResponsesClient;
}
