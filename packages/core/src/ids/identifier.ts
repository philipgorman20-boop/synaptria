declare const identifierBrand: unique symbol;

export type Identifier<TName extends string = string> = string & {
  readonly [identifierBrand]: TName;
};

export type UserId = Identifier<'UserId'>;
export type OrganizationId = Identifier<'OrganizationId'>;
export type MembershipId = Identifier<'MembershipId'>;
export type ProgramId = Identifier<'ProgramId'>;
export type RequestId = Identifier<'RequestId'>;
export type CorrelationId = Identifier<'CorrelationId'>;

export function identifier<TName extends string>(value: string, name: TName): Identifier<TName> {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new TypeError(`${name} cannot be empty.`);
  }

  return normalized as Identifier<TName>;
}

export const userId = (value: string): UserId => identifier(value, 'UserId');
export const organizationId = (value: string): OrganizationId =>
  identifier(value, 'OrganizationId');
export const membershipId = (value: string): MembershipId => identifier(value, 'MembershipId');
export const programId = (value: string): ProgramId => identifier(value, 'ProgramId');
export const requestId = (value: string): RequestId => identifier(value, 'RequestId');
export const correlationId = (value: string): CorrelationId => identifier(value, 'CorrelationId');
