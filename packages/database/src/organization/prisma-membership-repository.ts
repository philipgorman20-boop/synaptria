import type { Membership as PrismaMembership, Prisma, PrismaClient } from '@prisma/client';
import {
  identifier,
  type MembershipId,
  type OrganizationId,
  type OrganizationRole,
  type UserId,
} from '@synaptria/core';
import type {
  AddMembershipInput,
  MembershipRepository,
  MembershipStatus,
  OrganizationMembership,
} from '@synaptria/domain/organization';

export type MembershipDatabaseClient = Pick<PrismaClient, 'membership'>;

export class PrismaMembershipRepository implements MembershipRepository {
  constructor(private readonly client: MembershipDatabaseClient) {}

  async add(input: AddMembershipInput): Promise<OrganizationMembership> {
    const data: Prisma.MembershipUncheckedCreateInput = {
      organizationId: input.organizationId,
      userId: input.userId,
      role: input.role,
      status: input.status ?? 'ACTIVE',
      ...(input.invitedAt === undefined ? {} : { invitedAt: input.invitedAt }),
      ...(input.joinedAt === undefined ? {} : { joinedAt: input.joinedAt }),
    };

    return mapMembership(await this.client.membership.create({ data }));
  }

  async findById(id: MembershipId): Promise<OrganizationMembership | null> {
    const row = await this.client.membership.findUnique({ where: { id } });
    return row === null ? null : mapMembership(row);
  }

  async findForUser(
    organizationId: OrganizationId,
    userId: UserId,
  ): Promise<OrganizationMembership | null> {
    const row = await this.client.membership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    return row === null ? null : mapMembership(row);
  }

  async listMembers(
    organizationId: OrganizationId,
  ): Promise<readonly OrganizationMembership[]> {
    const rows = await this.client.membership.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(mapMembership);
  }

  async listForUser(userId: UserId): Promise<readonly OrganizationMembership[]> {
    const rows = await this.client.membership.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(mapMembership);
  }

  async updateRole(
    id: MembershipId,
    role: OrganizationRole,
  ): Promise<OrganizationMembership> {
    return mapMembership(
      await this.client.membership.update({ where: { id }, data: { role } }),
    );
  }

  async updateStatus(
    id: MembershipId,
    status: MembershipStatus,
    changedAt: Date,
  ): Promise<OrganizationMembership> {
    const data: Prisma.MembershipUpdateInput = {
      status,
      ...(status === 'ACTIVE' ? { joinedAt: changedAt, suspendedAt: null } : {}),
      ...(status === 'SUSPENDED' ? { suspendedAt: changedAt } : {}),
      ...(status === 'REMOVED' ? { suspendedAt: null } : {}),
    };

    return mapMembership(
      await this.client.membership.update({ where: { id }, data }),
    );
  }

  async isActiveMember(organizationId: OrganizationId, userId: UserId): Promise<boolean> {
    const count = await this.client.membership.count({
      where: { organizationId, userId, status: 'ACTIVE' },
    });
    return count > 0;
  }
}

export function mapMembership(row: PrismaMembership): OrganizationMembership {
  return {
    id: identifier(row.id, 'MembershipId') as MembershipId,
    organizationId: identifier(row.organizationId, 'OrganizationId') as OrganizationId,
    userId: identifier(row.userId, 'UserId') as UserId,
    role: row.role,
    status: row.status,
    ...(row.invitedAt === null ? {} : { invitedAt: row.invitedAt }),
    ...(row.joinedAt === null ? {} : { joinedAt: row.joinedAt }),
    ...(row.suspendedAt === null ? {} : { suspendedAt: row.suspendedAt }),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
