import type { OrganizationId, UserId } from '@synaptria/core';

import type {
  ActionExecutionRequest,
  ActionExecutionRequestSnapshot,
} from './models';

export interface CreateActionExecutionRequestInput {
  readonly organizationId: OrganizationId;
  readonly snapshot: ActionExecutionRequestSnapshot;
  readonly snapshotFingerprint: string;
  readonly requestedByUserId: UserId;
  readonly requestedAt: Date;
  readonly createIdempotencyKey: string;
}

export interface ConfirmActionExecutionRequestInput {
  readonly organizationId: OrganizationId;
  readonly requestId: string;
  readonly confirmedByUserId: UserId;
  readonly confirmedAt: Date;
  readonly confirmIdempotencyKey?: string;
}

export interface ActionExecutionRequestRepository {
  create(input: CreateActionExecutionRequestInput): Promise<ActionExecutionRequest>;

  findById(
    organizationId: OrganizationId,
    requestId: string,
  ): Promise<ActionExecutionRequest | null>;

  findByCreateIdempotencyKey(
    organizationId: OrganizationId,
    createIdempotencyKey: string,
  ): Promise<ActionExecutionRequest | null>;

  findBySnapshotFingerprint(
    organizationId: OrganizationId,
    snapshotFingerprint: string,
  ): Promise<ActionExecutionRequest | null>;

  confirm(input: ConfirmActionExecutionRequestInput): Promise<ActionExecutionRequest>;
}
