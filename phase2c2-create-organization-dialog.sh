#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f package.json || ! -d apps/web || ! -d packages/application ]]; then
  echo "Run this script from the Synaptria repository root." >&2
  exit 1
fi

mkdir -p apps/web/app/actions/organization apps/web/app/dashboard/components

cat > apps/web/app/actions/organization/create-organization.ts <<'EOF'
'use server';

import { ApplicationError } from '@synaptria/application';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  ACTIVE_ORGANIZATION_COOKIE,
  getRequestContext,
} from '../../../lib/request-context';
import { getOrganizationService } from '../../../lib/organization-service';

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export interface CreateOrganizationActionState {
  readonly status: 'idle' | 'error';
  readonly message?: string;
  readonly fieldErrors?: Readonly<{
    name?: string;
    slug?: string;
  }>;
  readonly values?: Readonly<{
    name: string;
    slug: string;
  }>;
}

export const initialCreateOrganizationState: CreateOrganizationActionState = {
  status: 'idle',
};

export async function createOrganizationAction(
  _previousState: CreateOrganizationActionState,
  formData: FormData,
): Promise<CreateOrganizationActionState> {
  const name = readText(formData, 'name');
  const slug = readText(formData, 'slug');
  const values = { name, slug };

  const fieldErrors: { name?: string; slug?: string } = {};

  if (name.length === 0) {
    fieldErrors.name = 'Organization name is required.';
  }

  if (slug.length === 0) {
    fieldErrors.slug = 'Workspace slug is required.';
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    fieldErrors.slug =
      'Use lowercase letters, numbers, and single hyphens only.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: 'error',
      message: 'Correct the highlighted fields and try again.',
      fieldErrors,
      values,
    };
  }

  try {
    const context = await getRequestContext();
    const result = await getOrganizationService().createOrganization(
      {
        userId: context.userId,
        requestId: context.requestId,
        correlationId: context.correlationId,
      },
      { name, slug },
    );

    const cookieStore = await cookies();
    cookieStore.set(
      ACTIVE_ORGANIZATION_COOKIE,
      result.organization.id,
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: ONE_YEAR_IN_SECONDS,
      },
    );
  } catch (error) {
    if (error instanceof ApplicationError) {
      const field = error.details?.field;
      const applicationFieldErrors =
        field === 'name' || field === 'slug'
          ? { [field]: error.message }
          : error.code === 'CONFLICT'
            ? { slug: error.message }
            : undefined;

      return {
        status: 'error',
        message:
          applicationFieldErrors === undefined
            ? error.message
            : 'Correct the highlighted fields and try again.',
        ...(applicationFieldErrors === undefined
          ? {}
          : { fieldErrors: applicationFieldErrors }),
        values,
      };
    }

    return {
      status: 'error',
      message: 'The organization could not be created. Please try again.',
      values,
    };
  }

  redirect('/dashboard');
}

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}
EOF

cat > apps/web/app/dashboard/components/create-organization-dialog.tsx <<'EOF'
'use client';

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import { useFormStatus } from 'react-dom';

import {
  createOrganizationAction,
  initialCreateOrganizationState,
} from '../../actions/organization/create-organization';

export function CreateOrganizationDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState(
    createOrganizationAction,
    initialCreateOrganizationState,
  );
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugWasEdited, setSlugWasEdited] = useState(false);

  useEffect(() => {
    if (state.status === 'error') {
      dialogRef.current?.showModal();
    }
  }, [state]);

  function openDialog() {
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    const nextName = event.target.value;
    setName(nextName);

    if (!slugWasEdited) {
      setSlug(toSlug(nextName));
    }
  }

  function handleSlugChange(event: ChangeEvent<HTMLInputElement>) {
    setSlugWasEdited(true);
    setSlug(toSlug(event.target.value));
  }

  return (
    <>
      <button
        className="create-organization-button"
        type="button"
        onClick={openDialog}
      >
        New organization
      </button>

      <dialog
        ref={dialogRef}
        className="organization-dialog"
        onCancel={closeDialog}
      >
        <form action={formAction} className="organization-form">
          <div className="organization-dialog-heading">
            <div>
              <p className="eyebrow">NEW WORKSPACE</p>
              <h2>Create an organization</h2>
              <p>
                Start a separate operating workspace with its own programs,
                finances, vendors, documents, and team.
              </p>
            </div>
            <button
              aria-label="Close dialog"
              className="dialog-close-button"
              type="button"
              onClick={closeDialog}
            >
              ×
            </button>
          </div>

          {state.status === 'error' && state.message !== undefined ? (
            <div className="form-error-summary" role="alert">
              {state.message}
            </div>
          ) : null}

          <div className="form-field">
            <label htmlFor="organization-name">Organization name</label>
            <input
              id="organization-name"
              name="name"
              type="text"
              autoComplete="organization"
              autoFocus
              required
              maxLength={120}
              value={name || state.values?.name || ''}
              aria-describedby={
                state.fieldErrors?.name === undefined
                  ? undefined
                  : 'organization-name-error'
              }
              aria-invalid={state.fieldErrors?.name !== undefined}
              onChange={handleNameChange}
              placeholder="Acme Therapeutics"
            />
            {state.fieldErrors?.name === undefined ? (
              <span className="form-help">The name shown throughout Synaptria.</span>
            ) : (
              <span className="form-field-error" id="organization-name-error">
                {state.fieldErrors.name}
              </span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="organization-slug">Workspace slug</label>
            <div className="slug-input-row">
              <span>synaptria.app/</span>
              <input
                id="organization-slug"
                name="slug"
                type="text"
                required
                maxLength={80}
                value={slug || state.values?.slug || ''}
                aria-describedby={
                  state.fieldErrors?.slug === undefined
                    ? undefined
                    : 'organization-slug-error'
                }
                aria-invalid={state.fieldErrors?.slug !== undefined}
                onChange={handleSlugChange}
                placeholder="acme-therapeutics"
              />
            </div>
            {state.fieldErrors?.slug === undefined ? (
              <span className="form-help">
                Lowercase letters, numbers, and hyphens only.
              </span>
            ) : (
              <span className="form-field-error" id="organization-slug-error">
                {state.fieldErrors.slug}
              </span>
            )}
          </div>

          <div className="organization-form-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={closeDialog}
            >
              Cancel
            </button>
            <CreateOrganizationSubmitButton />
          </div>
        </form>
      </dialog>
    </>
  );
}

function CreateOrganizationSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="primary-button"
      type="submit"
      disabled={pending}
    >
      {pending ? 'Creating…' : 'Create organization'}
    </button>
  );
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
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
import { CreateOrganizationDialog } from './components/create-organization-dialog';
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

          <div className="dashboard-button-row">
            <CreateOrganizationDialog />

            <form action={signOutCurrentUser}>
              <button className="sign-out-button" type="submit">
                Sign out
              </button>
            </form>
          </div>
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

.dashboard-button-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.create-organization-button,
.primary-button,
.secondary-button,
.dialog-close-button {
  appearance: none;
  cursor: pointer;
  font: inherit;
}

.create-organization-button,
.primary-button {
  border: 0;
  border-radius: 10px;
  background: #111827;
  color: white;
  font-weight: 650;
  padding: 12px 18px;
}

.create-organization-button:hover,
.primary-button:hover {
  background: #1f2937;
}

.primary-button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.secondary-button {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: white;
  color: #111827;
  font-weight: 650;
  padding: 11px 18px;
}

.organization-dialog {
  width: min(580px, calc(100vw - 32px));
  max-height: calc(100vh - 48px);
  overflow: auto;
  border: 0;
  border-radius: 20px;
  padding: 0;
  box-shadow: 0 30px 90px rgb(15 23 42 / 28%);
}

.organization-dialog::backdrop {
  background: rgb(15 23 42 / 58%);
  backdrop-filter: blur(3px);
}

.organization-form {
  display: grid;
  gap: 24px;
  padding: 32px;
}

.organization-dialog-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.organization-dialog-heading h2 {
  margin: 4px 0 10px;
  font-size: 1.75rem;
}

.organization-dialog-heading p:last-child {
  margin: 0;
  color: #4b5563;
  line-height: 1.55;
}

.dialog-close-button {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 50%;
  background: white;
  color: #4b5563;
  font-size: 1.5rem;
  line-height: 1;
}

.form-error-summary {
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fef2f2;
  color: #991b1b;
  padding: 12px 14px;
}

.form-field {
  display: grid;
  gap: 7px;
}

.form-field label {
  color: #111827;
  font-size: 0.9rem;
  font-weight: 700;
}

.form-field input {
  width: 100%;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: white;
  color: #111827;
  font: inherit;
  padding: 11px 13px;
}

.form-field input:focus-visible {
  outline: 3px solid rgb(37 99 235 / 20%);
  outline-offset: 1px;
  border-color: #2563eb;
}

.form-field input[aria-invalid='true'] {
  border-color: #dc2626;
}

.form-help,
.form-field-error {
  font-size: 0.8rem;
}

.form-help {
  color: #6b7280;
}

.form-field-error {
  color: #b91c1c;
}

.slug-input-row {
  display: flex;
  align-items: center;
  overflow: hidden;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #f9fafb;
}

.slug-input-row:focus-within {
  outline: 3px solid rgb(37 99 235 / 20%);
  outline-offset: 1px;
  border-color: #2563eb;
}

.slug-input-row > span {
  flex: 0 0 auto;
  padding-left: 13px;
  color: #6b7280;
  font-size: 0.9rem;
}

.slug-input-row input {
  border: 0;
  border-radius: 0;
  background: transparent;
}

.slug-input-row input:focus-visible {
  outline: 0;
}

.organization-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}

@media (max-width: 850px) {
  .dashboard-button-row,
  .dashboard-button-row form,
  .dashboard-button-row button {
    width: 100%;
  }
}

@media (max-width: 560px) {
  .organization-form {
    padding: 24px 20px;
  }

  .organization-form-actions {
    flex-direction: column-reverse;
  }

  .organization-form-actions button {
    width: 100%;
  }

  .slug-input-row > span {
    display: none;
  }
}
EOF

echo "Phase 2C.2 files installed."
