#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f package.json || ! -d apps/web || ! -d packages/application ]]; then
  echo "Run this script from the Synaptria repository root." >&2
  exit 1
fi

mkdir -p apps/web/app/actions/organization apps/web/app/dashboard/components apps/web/lib

cat > apps/web/lib/organization-service.ts <<'EOF'
import {
  CreateOrganizationUseCase,
  ListOrganizationsUseCase,
  OrganizationService,
  SwitchOrganizationUseCase,
  type OrganizationTransactionRepositories,
  type OrganizationUnitOfWork,
} from '@synaptria/application';
import {
  createPersistenceRepositories,
  db,
  withDatabaseTransaction,
} from '@synaptria/database';

class PrismaOrganizationUnitOfWork implements OrganizationUnitOfWork {
  async execute<T>(
    operation: (
      repositories: OrganizationTransactionRepositories,
    ) => Promise<T>,
  ): Promise<T> {
    return withDatabaseTransaction(db, async (repositories) =>
      operation(repositories),
    );
  }
}

const repositories = createPersistenceRepositories(db);
const organizationUnitOfWork = new PrismaOrganizationUnitOfWork();

const organizationService = new OrganizationService(
  new CreateOrganizationUseCase(organizationUnitOfWork),
  new ListOrganizationsUseCase(repositories.organizations),
  new SwitchOrganizationUseCase(organizationUnitOfWork),
);

/** Shared application-service composition root for the web delivery layer. */
export function getOrganizationService(): OrganizationService {
  return organizationService;
}
EOF

python3 - <<'PY'
from pathlib import Path
path = Path('apps/web/lib/request-context.ts')
text = path.read_text()
text = text.replace(
    "const ACTIVE_ORGANIZATION_COOKIE = 'synaptria.organization';",
    "export const ACTIVE_ORGANIZATION_COOKIE = 'synaptria.organization';",
)
path.write_text(text)
PY

cat > apps/web/app/actions/organization/switch-organization.ts <<'EOF'
'use server';

import { organizationId } from '@synaptria/core';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  ACTIVE_ORGANIZATION_COOKIE,
  getRequestContext,
} from '../../../lib/request-context';
import { getOrganizationService } from '../../../lib/organization-service';

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export async function switchOrganizationAction(
  formData: FormData,
): Promise<void> {
  const rawOrganizationId = formData.get('organizationId');

  if (
    typeof rawOrganizationId !== 'string' ||
    rawOrganizationId.trim().length === 0
  ) {
    throw new Error('A valid organization ID is required.');
  }

  const context = await getRequestContext();
  const result = await getOrganizationService().switchOrganization(
    {
      userId: context.userId,
      requestId: context.requestId,
      correlationId: context.correlationId,
      currentOrganizationId: context.organizationId,
    },
    {
      organizationId: organizationId(rawOrganizationId.trim()),
    },
  );

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  const cookieStore = await cookies();
  cookieStore.set(
    ACTIVE_ORGANIZATION_COOKIE,
    result.value.organization.id,
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: ONE_YEAR_IN_SECONDS,
    },
  );

  redirect('/dashboard');
}
EOF

cat > apps/web/app/dashboard/components/organization-switcher.tsx <<'EOF'
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
EOF

cat > apps/web/app/dashboard/page.tsx <<'EOF'
import {
  AuthenticationError,
  OrganizationMembershipRequiredError,
  type ResolvedOrganizationContext,
} from '@synaptria/auth';
import { appConfig, primaryNavigation } from '@synaptria/config';
import { Card, Stack } from '@synaptria/ui';
import { redirect } from 'next/navigation';

import { getOrganizationService } from '../../lib/organization-service';
import { getRequestContext } from '../../lib/request-context';

import { signOutCurrentUser } from '../actions/auth';
import { OrganizationSwitcher } from './components/organization-switcher';

const cards = [
  ['Programs', '0 active'],
  ['Projects', '0 in progress'],
  ['Open risks', '0'],
  ['Pending decisions', '0'],
] as const;

export default async function DashboardPage() {
  let context: ResolvedOrganizationContext;

  try {
    context = await getRequestContext();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect('/sign-in');
    }

    if (error instanceof OrganizationMembershipRequiredError) {
      redirect('/no-organization');
    }

    throw error;
  }

  const organizationList = await getOrganizationService().listOrganizations({
    userId: context.userId,
    activeOrganizationId: context.organizationId,
  });

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-heading">
          <p className="eyebrow">WORKSPACE</p>
          <h1>Executive dashboard</h1>
          <p>
            Welcome to the {appConfig.name} operating workspace. You are working
            in {context.organizationName} as {context.role.toLowerCase()}.
          </p>
        </div>

        <div className="dashboard-controls">
          <OrganizationSwitcher
            activeOrganizationId={context.organizationId}
            organizations={organizationList.organizations.map((item) => ({
              id: item.organization.id,
              name: item.organization.name,
              role: item.membership.role,
            }))}
          />

          <form action={signOutCurrentUser}>
            <button className="sign-out-button" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section className="grid" aria-label="Workspace metrics">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <Stack gap={12}>
              <span>{label}</span>
              <strong>{value}</strong>
            </Stack>
          </Card>
        ))}
      </section>

      <section className="dashboard-section">
        <h2>Planned modules</h2>

        <div className="module-list">
          {primaryNavigation.map((item) => (
            <Card key={item.href}>
              <Stack gap={8}>
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </Stack>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
EOF

cat >> apps/web/app/globals.css <<'EOF'

.dashboard-heading {
  min-width: 0;
}

.dashboard-controls {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.organization-switcher {
  display: grid;
  gap: 6px;
  min-width: min(320px, 60vw);
}

.organization-switcher label {
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.organization-switcher-control {
  display: grid;
  gap: 5px;
}

.organization-switcher select {
  appearance: none;
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: white;
  color: #111827;
  cursor: pointer;
  font: inherit;
  font-weight: 650;
  padding: 11px 38px 11px 13px;
  background-image:
    linear-gradient(45deg, transparent 50%, #6b7280 50%),
    linear-gradient(135deg, #6b7280 50%, transparent 50%);
  background-position:
    calc(100% - 17px) calc(50% - 2px),
    calc(100% - 12px) calc(50% - 2px);
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
}

.organization-switcher select:focus-visible {
  outline: 3px solid rgb(37 99 235 / 20%);
  outline-offset: 1px;
  border-color: #2563eb;
}

.organization-switcher select:disabled {
  cursor: default;
  opacity: 0.72;
}

.organization-switcher-status {
  min-height: 1rem;
  color: #6b7280;
  font-size: 0.75rem;
}

@media (max-width: 850px) {
  .dashboard-controls {
    width: 100%;
    align-items: stretch;
    flex-direction: column;
  }

  .organization-switcher {
    min-width: 0;
    width: 100%;
  }

  .dashboard-controls form:last-child,
  .dashboard-controls .sign-out-button {
    width: 100%;
  }
}
EOF

python3 - <<'PY'
import json
from pathlib import Path
path = Path('apps/web/package.json')
data = json.loads(path.read_text())
deps = data.setdefault('dependencies', {})
deps['@synaptria/application'] = 'workspace:*'
path.write_text(json.dumps(data, indent=2) + '\n')
PY

echo "Phase 2C.1 files installed."
echo "Run pnpm install, then the validation commands provided in ChatGPT."
