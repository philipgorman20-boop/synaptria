import type { AIProviderCapability, AIProviderId } from '../constants';
import type {
  AIProvider,
  AIProviderExecuteContext,
  AIProviderRequest,
  AIProviderResponse,
} from '../types/contracts';

export class FakeAIProvider implements AIProvider {
  readonly calls: Array<{ request: AIProviderRequest; context: AIProviderExecuteContext }> = [];

  constructor(
    readonly providerId: AIProviderId,
    readonly capabilities: readonly AIProviderCapability[],
    private readonly handler: (
      request: AIProviderRequest,
      context: AIProviderExecuteContext,
    ) => Promise<AIProviderResponse>,
  ) {}

  supports(request: AIProviderRequest): boolean {
    const capability = request.output.mode === 'text' ? 'plain_text' : 'structured_output';
    return this.capabilities.includes(capability);
  }

  async execute(
    request: AIProviderRequest,
    context: AIProviderExecuteContext,
  ): Promise<AIProviderResponse> {
    this.calls.push({ request, context });
    return this.handler(request, context);
  }
}

export function textProviderResponse(
  overrides: Partial<AIProviderResponse> & Pick<AIProviderResponse, 'model'>,
): AIProviderResponse {
  return {
    provider: 'openai',
    model: overrides.model,
    output: overrides.output ?? { mode: 'text', text: 'hello' },
    usage: overrides.usage ?? { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
    latency: overrides.latency ?? { durationMs: 42 },
    finishStatus: overrides.finishStatus ?? 'completed',
    validation: overrides.validation ?? { valid: true },
    ...(overrides.metadata === undefined ? {} : { metadata: overrides.metadata }),
  };
}
