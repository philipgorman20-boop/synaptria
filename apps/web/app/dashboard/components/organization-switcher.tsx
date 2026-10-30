'use client';

import type { OrganizationId, OrganizationRole } from '@synaptria/core';
import { useRef, useTransition } from 'react';

import { switchOrganizationAction } from '../../actions/organization/switch-organization';

export interface OrganizationSwitcherItem {
  readonly id: OrganizationId;
  readonly name: string;
  readonly role: OrganizationRole;
}

export interface OrganizationSwitcherProps {
  readonly activeOrganizationId: OrganizationId;
  readonly organizations: readonly OrganizationSwitcherItem[];
}

export function OrganizationSwitcher({
  activeOrganizationId,
  organizations,
}: OrganizationSwitcherProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={switchOrganizationAction}
      className="organization-switcher"
    >
      <label htmlFor="organization-switcher-select">Organization</label>
      <div className="organization-switcher-control">
        <select
          id="organization-switcher-select"
          name="organizationId"
          defaultValue={activeOrganizationId}
          disabled={isPending || organizations.length < 2}
          onChange={() => {
            startTransition(() => {
              formRef.current?.requestSubmit();
            });
          }}
        >
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.name} · {formatRole(organization.role)}
            </option>
          ))}
        </select>
        <span aria-live="polite" className="organization-switcher-status">
          {isPending ? 'Switching…' : `${organizations.length} workspace${organizations.length === 1 ? '' : 's'}`}
        </span>
      </div>
    </form>
  );
}

function formatRole(role: OrganizationRole): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}
