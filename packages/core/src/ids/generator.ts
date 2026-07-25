import { correlationId, requestId, type CorrelationId, type RequestId } from './identifier';

export interface IdGenerator {
  generate(): string;
}

export class CryptoIdGenerator implements IdGenerator {
  generate(): string {
    return crypto.randomUUID();
  }
}

export function createRequestId(generator: IdGenerator = new CryptoIdGenerator()): RequestId {
  return requestId(generator.generate());
}

export function createCorrelationId(
  generator: IdGenerator = new CryptoIdGenerator(),
): CorrelationId {
  return correlationId(generator.generate());
}
