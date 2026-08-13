export const AI_PROVIDER_IDS = ['openai'] as const;

export type AIProviderId = (typeof AI_PROVIDER_IDS)[number];

export const AI_PROVIDER_CAPABILITIES = ['plain_text', 'structured_output'] as const;

export type AIProviderCapability = (typeof AI_PROVIDER_CAPABILITIES)[number];

export const AI_PROVIDER_FINISH_STATUSES = [
  'completed',
  'incomplete',
  'refused',
  'failed',
] as const;

export type AIProviderFinishStatus = (typeof AI_PROVIDER_FINISH_STATUSES)[number];

export const AI_PROVIDER_DATA_CLASSIFICATIONS = [
  'public',
  'internal',
  'confidential',
  'restricted',
] as const;

export type AIProviderDataClassification =
  (typeof AI_PROVIDER_DATA_CLASSIFICATIONS)[number];
