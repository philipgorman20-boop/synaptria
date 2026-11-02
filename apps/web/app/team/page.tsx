import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import type { OrganizationRole } from '@synaptria/core';
import { redirect } from 'next/navigation';

import { db } from '@synaptria/database';
import { getRequestContext } from '../../lib/request-context';

const ROLE_ORDER: OrganizationRole[] = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];

const ROLE_LABEL: Record<OrganizationRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
  VIEWER: 'Viewer',
};

export default async function TeamPage() {
  let context: ResolvedOrganizationContext;

  try {
    context = await getRequestContext();
  } catch (error) {
    if (error instanceof AuthenticationError) redirect('/sign-in');
    if (error instanceof OrganizationMembershipRequiredError) redirect('/no-organization');
    throw error;
  }

  const memberships = await db.membership.findMany({
    where: {
      organizationId: context.organizationId,
      status: { not: 'REMOVED' },
    },
    include: {
      user: {
        select: { id: true, name: true, displayName: true, email: true, image: true },
      },
    },
    orderBy: [{ createdAt: 'asc' }],
  });

  const sorted = [...memberships].sort(
    (a, b) => ROLE_ORDER.indexOf(a.role as OrganizationRole) - ROLE_ORDER.indexOf(b.role as OrganizationRole),
  );

  const activeCount = memberships.filter((m) => m.status === 'ACTIVE').length;

  return (
    <main className="dashboard">
      <div className="page-header">
        <div>
          <h1>Team</h1>
          <p className="page-subtitle">
            {activeCount} active {activeCount === 1 ? 'member' : 'members'} in {context.organizationName}
          </p>
        </div>
      </div>

      <section aria-label="Team members">
        <div className="team-grid">
          {sorted.map((m) => {
            const displayName = m.user.displayName ?? m.user.name ?? m.user.email;
            const initials = getInitials(m.user.displayName ?? m.user.name ?? m.user.email);
            const isCurrentUser = m.userId === context.userId;

            return (
              <div key={m.id} className={`team-member-card${isCurrentUser ? ' team-member-card--self' : ''}`}>
                <div className={`team-avatar team-avatar--${m.role.toLowerCase()}`} aria-hidden="true">
                  {m.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.user.image} alt="" className="team-avatar-img" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <div className="team-member-info">
                  <div className="team-member-name">
                    {displayName}
                    {isCurrentUser ? <span className="team-member-you">you</span> : null}
                  </div>
                  <div className="team-member-email">{m.user.email}</div>
                </div>
                <div className="team-member-meta">
                  <span className={`team-role-badge team-role-badge--${m.role.toLowerCase()}`}>
                    {ROLE_LABEL[m.role as OrganizationRole]}
                  </span>
                  {m.status !== 'ACTIVE' ? (
                    <span className={`team-status-badge team-status-badge--${m.status.toLowerCase()}`}>
                      {m.status.charAt(0) + m.status.slice(1).toLowerCase()}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
