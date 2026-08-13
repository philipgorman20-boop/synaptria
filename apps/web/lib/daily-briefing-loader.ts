import type { DailyBriefingNarrative, DailyBriefingSnapshot } from '@synaptria/application';
import { ApplicationError } from '@synaptria/application';
import { ProviderError } from '@synaptria/ai';
import type { GetDailyBriefingSnapshotContext } from '@synaptria/application';

import { getDailyBriefingNarrativeService } from './daily-briefing-narrative-service';
import { getDailyBriefingService } from './daily-briefing-service';

export const DAILY_BRIEFING_AI_UNAVAILABLE_MESSAGE =
  'AI summary unavailable. Operational briefing data is still current.';

export const DAILY_BRIEFING_NARRATIVE_LOADING_MESSAGE =
  'Generating grounded executive summary…';

export interface DailyBriefingNarrativeResult {
  readonly narrative: DailyBriefingNarrative | null;
  readonly aiSummaryUnavailable: boolean;
}

export interface DailyBriefingLoaderDependencies {
  readonly getSnapshot: (
    context: GetDailyBriefingSnapshotContext,
  ) => Promise<DailyBriefingSnapshot>;
  readonly generateNarrative: (input: {
    readonly snapshot: DailyBriefingSnapshot;
  }) => Promise<DailyBriefingNarrative>;
}

const defaultDependencies: DailyBriefingLoaderDependencies = {
  getSnapshot(context) {
    return getDailyBriefingService().getSnapshot(context);
  },
  generateNarrative(input) {
    return getDailyBriefingNarrativeService().generateNarrative(input);
  },
};

export function isExpectedNarrativeGenerationFailure(error: unknown): boolean {
  return error instanceof ApplicationError || error instanceof ProviderError;
}

export interface DailyBriefingNarrativeFailureDiagnostic {
  readonly errorName: string;
  readonly message: string;
  readonly applicationErrorCode?: string;
  readonly providerErrorCode?: string;
  readonly finishStatus?: string;
  readonly validationIssues?: readonly string[];
  readonly issues?: readonly string[];
}

function shouldLogDailyBriefingDevDiagnostics(): boolean {
  return process.env.NODE_ENV !== 'production';
}

function pickSafeString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function pickSafeStringArray(value: unknown): readonly string[] | undefined {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    return undefined;
  }

  return value;
}

function pickSafeFailureDetails(details: Readonly<Record<string, unknown>> | undefined): {
  finishStatus?: string;
  validationIssues?: readonly string[];
  issues?: readonly string[];
  providerErrorCode?: string;
} {
  if (details === undefined) {
    return {};
  }

  const picked: {
    finishStatus?: string;
    validationIssues?: readonly string[];
    issues?: readonly string[];
    providerErrorCode?: string;
  } = {};

  const finishStatus = pickSafeString(details.finishStatus);
  if (finishStatus !== undefined) {
    picked.finishStatus = finishStatus;
  }

  const providerErrorCode = pickSafeString(details.providerErrorCode);
  if (providerErrorCode !== undefined) {
    picked.providerErrorCode = providerErrorCode;
  }

  const validationIssues = pickSafeStringArray(details.validationIssues);
  if (validationIssues !== undefined) {
    picked.validationIssues = validationIssues;
  }

  const issues = pickSafeStringArray(details.issues);
  if (issues !== undefined) {
    picked.issues = issues;
  }

  return picked;
}

export function buildDailyBriefingNarrativeFailureDiagnostic(
  error: unknown,
): DailyBriefingNarrativeFailureDiagnostic | null {
  if (!shouldLogDailyBriefingDevDiagnostics()) {
    return null;
  }

  if (error instanceof ApplicationError) {
    const details = pickSafeFailureDetails(error.details);
    const providerErrorCode =
      details.providerErrorCode ??
      (error.cause instanceof ProviderError ? error.cause.code : undefined);

    return {
      errorName: error.name,
      message: error.message,
      applicationErrorCode: error.code,
      ...(providerErrorCode === undefined ? {} : { providerErrorCode }),
      ...(details.finishStatus === undefined ? {} : { finishStatus: details.finishStatus }),
      ...(details.validationIssues === undefined
        ? {}
        : { validationIssues: details.validationIssues }),
      ...(details.issues === undefined ? {} : { issues: details.issues }),
    };
  }

  if (error instanceof ProviderError) {
    const details = pickSafeFailureDetails(error.details);

    return {
      errorName: error.name,
      message: error.message,
      providerErrorCode: error.code,
      ...(details.finishStatus === undefined ? {} : { finishStatus: details.finishStatus }),
      ...(details.validationIssues === undefined
        ? {}
        : { validationIssues: details.validationIssues }),
      ...(details.issues === undefined ? {} : { issues: details.issues }),
    };
  }

  return null;
}

export function logDailyBriefingNarrativeFailureDiagnostic(error: unknown): void {
  const diagnostic = buildDailyBriefingNarrativeFailureDiagnostic(error);
  if (diagnostic === null) {
    return;
  }

  console.error('[daily-briefing] narrative generation unavailable', diagnostic);
}

export interface DailyBriefingNarrativeGenerationDiagnostics {
  readonly durationMs: number;
  readonly provider?: string;
  readonly model?: string;
  readonly inputTokens?: number;
  readonly outputTokens?: number;
  readonly totalTokens?: number;
  readonly reasoningTokens?: number;
  readonly finishStatus?: string;
}

export function logDailyBriefingDevTiming(
  phase: 'snapshot' | 'narrative',
  durationMs: number,
): void {
  if (!shouldLogDailyBriefingDevDiagnostics()) {
    return;
  }

  console.info(`[daily-briefing] ${phase} generation ${Math.round(durationMs)}ms`);
}

export function logDailyBriefingNarrativeGenerationDiagnostics(
  diagnostics: DailyBriefingNarrativeGenerationDiagnostics,
): void {
  if (!shouldLogDailyBriefingDevDiagnostics()) {
    return;
  }

  const fields = [
    `durationMs=${Math.round(diagnostics.durationMs)}`,
    diagnostics.provider === undefined ? undefined : `provider=${diagnostics.provider}`,
    diagnostics.model === undefined ? undefined : `model=${diagnostics.model}`,
    diagnostics.inputTokens === undefined ? undefined : `inputTokens=${diagnostics.inputTokens}`,
    diagnostics.outputTokens === undefined ? undefined : `outputTokens=${diagnostics.outputTokens}`,
    diagnostics.totalTokens === undefined ? undefined : `totalTokens=${diagnostics.totalTokens}`,
    diagnostics.reasoningTokens === undefined
      ? undefined
      : `reasoningTokens=${diagnostics.reasoningTokens}`,
    diagnostics.finishStatus === undefined ? undefined : `finishStatus=${diagnostics.finishStatus}`,
  ].filter((field): field is string => field !== undefined);

  console.info(`[daily-briefing] narrative generation ${fields.join(' ')}`);
}

function extractNarrativeFailureFinishStatus(error: unknown): string | undefined {
  if (!(error instanceof ApplicationError)) {
    return undefined;
  }

  const finishStatus = error.details?.finishStatus;
  return typeof finishStatus === 'string' ? finishStatus : undefined;
}

export async function loadDailyBriefingSnapshot(
  context: GetDailyBriefingSnapshotContext,
  dependencies: Pick<DailyBriefingLoaderDependencies, 'getSnapshot'> = defaultDependencies,
): Promise<DailyBriefingSnapshot> {
  const startedAt = performance.now();
  const snapshot = await dependencies.getSnapshot(context);
  logDailyBriefingDevTiming('snapshot', performance.now() - startedAt);
  return snapshot;
}

export async function resolveDailyBriefingNarrative(
  snapshot: DailyBriefingSnapshot,
  dependencies: Pick<DailyBriefingLoaderDependencies, 'generateNarrative'> = defaultDependencies,
): Promise<DailyBriefingNarrativeResult> {
  const startedAt = performance.now();

  try {
    const narrative = await dependencies.generateNarrative({ snapshot });
    const { usage, latencyMs, provider, model } = narrative.generation;
    logDailyBriefingNarrativeGenerationDiagnostics({
      durationMs: latencyMs,
      provider,
      model,
      finishStatus: 'completed',
      ...(usage.inputTokens === undefined ? {} : { inputTokens: usage.inputTokens }),
      ...(usage.outputTokens === undefined ? {} : { outputTokens: usage.outputTokens }),
      ...(usage.totalTokens === undefined ? {} : { totalTokens: usage.totalTokens }),
      ...(usage.reasoningTokens === undefined ? {} : { reasoningTokens: usage.reasoningTokens }),
    });
    return {
      narrative,
      aiSummaryUnavailable: false,
    };
  } catch (error) {
    if (!isExpectedNarrativeGenerationFailure(error)) {
      throw error;
    }

    logDailyBriefingNarrativeFailureDiagnostic(error);
    const failureFinishStatus = extractNarrativeFailureFinishStatus(error);
    logDailyBriefingNarrativeGenerationDiagnostics({
      durationMs: performance.now() - startedAt,
      ...(failureFinishStatus === undefined ? {} : { finishStatus: failureFinishStatus }),
    });

    return {
      narrative: null,
      aiSummaryUnavailable: true,
    };
  }
}

export function startDailyBriefingNarrativeGeneration(
  snapshot: DailyBriefingSnapshot,
  dependencies: DailyBriefingLoaderDependencies = defaultDependencies,
): Promise<DailyBriefingNarrativeResult> {
  return resolveDailyBriefingNarrative(snapshot, dependencies);
}
