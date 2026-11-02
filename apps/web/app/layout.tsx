import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import type { OrganizationRole } from '@synaptria/core';
import { Inter } from 'next/font/google';
import { AppShell } from './components/app-shell';
import { getRequestContext } from '../lib/request-context';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Synaptria',
  description: 'The AI Operating System for Biotech',
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  let role: OrganizationRole | null = null;
  try {
    const ctx = await getRequestContext();
    role = ctx.role;
  } catch {
    // Public page or unauthenticated — role stays null
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <AppShell role={role}>{children}</AppShell>
      </body>
    </html>
  );
}
