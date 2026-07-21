import Link from 'next/link';
import { auth } from '@synaptria/auth';
import { appConfig } from '@synaptria/config';
import { redirect } from 'next/navigation';

import { signInWithGoogle } from '../actions/auth';

export default async function SignInPage() {
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">SYNAPTRIA</p>
        <h1>Sign in to your workspace</h1>

        <p className="auth-description">
          Use your Google account to access {appConfig.name}.
        </p>

        <form action={signInWithGoogle}>
          <button className="auth-button" type="submit">
            Continue with Google
          </button>
        </form>

        <Link className="auth-home-link" href="/">
          Return to home
        </Link>
      </section>
    </main>
  );
}
