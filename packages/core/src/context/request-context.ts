import type { CorrelationId, RequestId } from '../ids';
import type { TenantContext } from './tenant-context';

export interface RequestContext extends TenantContext {
  requestId: RequestId;
  correlationId: CorrelationId;
}
