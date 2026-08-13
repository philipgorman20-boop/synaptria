import type {
  AIProviderCapability,
  AIProviderDataClassification,
  AIProviderFinishStatus,
  AIProviderId,
} from '../constants';
import type { JsonSchema } from '../schema/json-schema';

export type AIProviderOutputMode = 'text' | 'structured';

export type AIProviderReasoningEffort =
  | 'none'
  | 'minimal'
  | 'low'
  | 'medium'
  | 'high';

export interface AIProviderTextOutputRequest {
  readonly mode: 'text';
}

export interface AIProviderStructuredOutputRequest {
  readonly mode: 'structured';
  readonly schema: JsonSchema;
  readonly schemaName?: string;
}

export type AIProviderOutputRequest =
  | AIProviderTextOutputRequest
  | AIProviderStructuredOutputRequest;

export interface AIProviderGenerationOptions {
  readonly temperature?: number;
  readonly maxOutputTokens?: number;
  readonly reasoningEffort?: AIProviderReasoningEffort;
}

export interface AIProviderDataHandling {
  readonly storeResponse: boolean;
  readonly classification?: AIProviderDataClassification;
}

export interface AIProviderRequest {
  readonly capabilityId: string;
  readonly input: string;
  readonly instructions?: string;
  readonly output: AIProviderOutputRequest;
  readonly generationOptions?: AIProviderGenerationOptions;
  readonly dataHandling: AIProviderDataHandling;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface AIProviderUsage {
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly totalTokens?: number;
  readonly reasoningTokens?: number;
}

export interface AIProviderLatency {
  readonly durationMs: number;
}

export interface AIProviderValidationResult {
  readonly valid: boolean;
  readonly issues?: readonly string[];
}

export interface AIProviderTextOutput {
  readonly mode: 'text';
  readonly text: string;
}

export interface AIProviderStructuredOutput {
  readonly mode: 'structured';
  readonly data: unknown;
}

export type AIProviderOutput =
  | AIProviderTextOutput
  | AIProviderStructuredOutput;

export interface AIProviderResponse {
  readonly provider: AIProviderId;
  readonly model: string;
  readonly output: AIProviderOutput;
  readonly usage: AIProviderUsage;
  readonly latency: AIProviderLatency;
  readonly finishStatus: AIProviderFinishStatus;
  readonly validation: AIProviderValidationResult;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface AIProviderExecuteContext {
  readonly model: string;
}

export interface AIProvider {
  readonly providerId: AIProviderId;
  readonly capabilities: readonly AIProviderCapability[];
  supports(request: AIProviderRequest): boolean;
  execute(
    request: AIProviderRequest,
    context: AIProviderExecuteContext,
  ): Promise<AIProviderResponse>;
}

export function requiredProviderCapability(
  request: AIProviderRequest,
): AIProviderCapability {
  return request.output.mode === 'text' ? 'plain_text' : 'structured_output';
}

export function providerSupportsRequest(
  provider: Pick<AIProvider, 'capabilities'>,
  request: AIProviderRequest,
): boolean {
  return provider.capabilities.includes(requiredProviderCapability(request));
}
