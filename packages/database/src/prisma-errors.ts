import { Prisma } from '@prisma/client';
import { CoreError } from '@synaptria/core/errors';

export function isUniqueConstraintViolation(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
  );
}

export function throwUniqueConstraintConflict(
  error: unknown,
  conflicts: Readonly<Record<string, string>>,
  fallbackField: string,
): never {
  if (!isUniqueConstraintViolation(error)) {
    throw error;
  }

  const target = error.meta?.target;
  const fields = Array.isArray(target)
    ? target.filter((field): field is string => typeof field === 'string')
    : [];
  const matchedField =
    fields.find((field) => field in conflicts) ??
    fields.find((field) => field !== 'organizationId') ??
    fallbackField;

  throw new CoreError({
    code: 'CONFLICT',
    message: conflicts[matchedField] ?? 'A record with the same unique value already exists.',
    details: { field: matchedField },
    cause: error,
  });
}
