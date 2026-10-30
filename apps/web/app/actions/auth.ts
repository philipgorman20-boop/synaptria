'use server';

import { signIn, signOut } from '@synaptria/auth';

export async function signInWithGoogle(): Promise<void> {
  await signIn('google', {
    redirectTo: '/dashboard',
  });
}

export async function signOutCurrentUser(): Promise<void> {
  await signOut({
    redirectTo: '/',
  });
}
