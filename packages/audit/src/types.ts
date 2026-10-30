import type {
  CorrelationId,
  OrganizationId,
  RequestContext,
  RequestId,
  UserId,
} from '@synaptria/core';

export const AUDIT_ACTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'RESTORE',
  'LOGIN',
  'LOGOUT',
  'EXPORT',
  'IMPORT',
  'APPROVE',
  'REJECT',
  'PUBLISH',
  'ARCHIVE',
  'CUSTOM',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const ACTOR_TYPES = ['USER', 'API_KEY', 'SYSTEM', 'AI_AGENT'] as const;
export type ActorType = (typeof ACTOR_TYPES)[number];

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | readonly JsonValue[];
export type JsonObject = Readonly<{ [key: string]: JsonValue }>;

export interface AuditActor {
  type: ActorType;
  id?: string;
  userId?: UserId;
}

export interface AuditTarget {
  entityType: string;
  entityId?: string;
  programId?: string;
}

export interface AuditRequestDetails {
  requestId?: RequestId;
  correlationId?: CorrelationId;
  ipAddress?: string;
  userAgent?: string;
}

export interface RecordAuditEventInput {
  organizationId: OrganizationId;
  actor: AuditActor;
  action: AuditAction;
  target: AuditTarget;
  request?: AuditRequestDetails;
  before?: JsonValue;
  after?: JsonValue;
  metadata?: JsonObject;
  occurredAt?: Date;
}

export interface RecordUserAuditEventInput {
  context: RequestContext;
  action: AuditAction;
  target: AuditTarget;
  ipAddress?: string;
  userAgent?: string;
  before?: unknown;
  after?: unknown;
  metadata?: Readonly<Record<string, unknown>>;
  occurredAt?: Date;
}

export interface AuditEventRecord extends RecordAuditEventInput {
  id: string;
  occurredAt: Date;
}
