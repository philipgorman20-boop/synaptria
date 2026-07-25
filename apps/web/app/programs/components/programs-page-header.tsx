import { routes } from '@synaptria/config';
import Link from 'next/link';

export interface ProgramsPageHeaderProps {
  readonly organizationName: string;
  readonly role: string;
  readonly programCount: number;
}

export function ProgramsPageHeader({
  organizationName,
  role,
  programCount,
}: ProgramsPageHeaderProps) {
  return (
    <header className="programs-page-header">
      <div className="programs-page-heading">
        <p className="eyebrow">PORTFOLIO</p>
        <h1>Programs</h1>
        <p>
          Strategic initiatives for {organizationName}. You are viewing this
          portfolio as {role.toLowerCase()}.
        </p>
        <p className="programs-page-count" aria-live="polite">
          {programCount === 1 ? '1 program' : `${programCount} programs`}
        </p>
      </div>

      <div className="programs-page-actions">
        <button
          className="primary-button"
          type="button"
          disabled
          aria-disabled="true"
          title="Program creation dialog is not available yet."
        >
          Create program
        </button>
        <Link className="secondary-button programs-page-back-link" href={routes.dashboard}>
          Back to dashboard
        </Link>
      </div>
    </header>
  );
}
