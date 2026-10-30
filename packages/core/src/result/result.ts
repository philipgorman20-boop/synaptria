export type Success<T> = Readonly<{ ok: true; value: T }>;
export type Failure<E> = Readonly<{ ok: false; error: E }>;
export type Result<T, E> = Success<T> | Failure<E>;

export const success = <T>(value: T): Success<T> => ({ ok: true, value });
export const failure = <E>(error: E): Failure<E> => ({ ok: false, error });

export function mapResult<T, U, E>(result: Result<T, E>, mapper: (value: T) => U): Result<U, E> {
  return result.ok ? success(mapper(result.value)) : result;
}

export function unwrapResult<T, E>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value;
  }

  throw result.error;
}
