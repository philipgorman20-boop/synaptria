import Link from 'next/link';

import { signOutCurrentUser } from '../actions/auth';

export default function NoOrganizationPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">WORKSPACE REQUIRED</p>
        <h1>No active organization</h1>
        <p className="auth-description">
          Your account is authenticated, but it does not currently have an active
          Synaptria organization membership. Ask an organization owner to invite you,
          or sign out and use a different account.
        </p>
        <form action={signOutCurrentUser}>
          <button className="auth-button" type="submit">
            Sign out
          </button>
        </form>
        <Link className="auth-home-link" href="/">
          Return home
        </Link>
      </section>
    </main>
  );
}
