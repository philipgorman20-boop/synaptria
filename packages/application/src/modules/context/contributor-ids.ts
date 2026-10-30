import { identifier } from '@synaptria/core';
import type { ContextContributorId } from '@synaptria/domain/context';
import { KNOWN_CONTEXT_CONTRIBUTOR_IDS } from '@synaptria/domain/context';

export const CONTEXT_CONTRIBUTOR_IDS = {
  primaryEntity: identifier(
    KNOWN_CONTEXT_CONTRIBUTOR_IDS[0],
    'ContextContributorId',
  ),
  relatedEntities: identifier(
    KNOWN_CONTEXT_CONTRIBUTOR_IDS[1],
    'ContextContributorId',
  ),
  events: identifier(KNOWN_CONTEXT_CONTRIBUTOR_IDS[2], 'ContextContributorId'),
  organizationalMemory: identifier(
    KNOWN_CONTEXT_CONTRIBUTOR_IDS[3],
    'ContextContributorId',
  ),
} as const satisfies Readonly<Record<string, ContextContributorId>>;
