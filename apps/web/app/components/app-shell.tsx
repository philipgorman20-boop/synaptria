'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PUBLIC_PATHS = ['/', '/sign-in', '/no-organization'];

const NAV_SECTIONS = [
  {
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: IconDashboard },
    ],
  },
  {
    label: 'RESEARCH',
    items: [
      { href: '/programs', label: 'Programs', icon: IconPrograms },
      { href: '/projects', label: 'Projects', icon: IconProjects },
      { href: '/documents', label: 'Documents', icon: IconDocuments },
    ],
  },
  {
    label: 'GOVERNANCE',
    items: [
      { href: '/risks', label: 'Risks', icon: IconRisks },
      { href: '/decisions', label: 'Decisions', icon: IconDecisions },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { href: '/finance', label: 'Finance', icon: IconFinance },
      { href: '/budgets', label: 'Budgets', icon: IconBudgets },
      { href: '/vendors', label: 'Vendors', icon: IconVendors },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { href: '/daily-briefing', label: 'Daily Briefing', icon: IconBriefing },
      { href: '/recommendations', label: 'Recommendations', icon: IconRecommendations },
    ],
  },
];

export function AppShell({ children }: { readonly children: ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isPublic) return <>{children}</>;

  return (
    <div className="app-shell">
      <nav className="app-sidebar" aria-label="Main navigation">
        <div className="app-sidebar-header">
          <Link href="/dashboard" className="app-logo-link">
            <span className="app-logo-mark" aria-hidden="true">S</span>
            <span className="app-logo-name">Synaptria</span>
          </Link>
        </div>

        <div className="app-sidebar-nav">
          {NAV_SECTIONS.map((section, i) => (
            <div key={i} className="app-nav-section">
              {section.label !== undefined ? (
                <p className="app-nav-section-label">{section.label}</p>
              ) : null}
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`app-nav-link${active ? ' app-nav-link--active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </nav>

      <div className="app-main">{children}</div>
    </div>
  );
}

function IconDashboard() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".7" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".7" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".7" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".7" />
    </svg>
  );
}

function IconPrograms() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="2.5" fill="currentColor" />
      <circle cx="8" cy="2" r="1.5" fill="currentColor" opacity=".6" />
      <circle cx="13.2" cy="11" r="1.5" fill="currentColor" opacity=".6" />
      <circle cx="2.8" cy="11" r="1.5" fill="currentColor" opacity=".6" />
      <line x1="8" y1="3.5" x2="8" y2="5.5" stroke="currentColor" strokeWidth="1.2" opacity=".5" />
      <line x1="7.3" y1="9.8" x2="3.4" y2="10.3" stroke="currentColor" strokeWidth="1.2" opacity=".5" />
      <line x1="8.7" y1="9.8" x2="12.6" y2="10.3" stroke="currentColor" strokeWidth="1.2" opacity=".5" />
    </svg>
  );
}

function IconProjects() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M1 4.5C1 3.67 1.67 3 2.5 3H6L7.5 5H13.5C14.33 5 15 5.67 15 6.5V12.5C15 13.33 14.33 14 13.5 14H2.5C1.67 14 1 13.33 1 12.5V4.5Z" fill="currentColor" opacity=".7" />
    </svg>
  );
}

function IconDocuments() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 2C3 1.45 3.45 1 4 1H9L13 5V14C13 14.55 12.55 15 12 15H4C3.45 15 3 14.55 3 14V2Z" fill="currentColor" opacity=".7" />
      <path d="M9 1V5H13" stroke="white" strokeWidth="1" strokeLinejoin="round" />
      <line x1="5.5" y1="8" x2="10.5" y2="8" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="5.5" y1="10.5" x2="10.5" y2="10.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function IconRisks() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.5L14.5 13.5H1.5L8 1.5Z" fill="currentColor" opacity=".7" />
      <line x1="8" y1="6" x2="8" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="12" r="0.75" fill="white" />
    </svg>
  );
}

function IconDecisions() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity=".5" />
      <path d="M8 5L3 8.5V12L8 9L13 12V8.5L8 5Z" fill="currentColor" opacity=".7" />
    </svg>
  );
}

function IconFinance() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 12L5.5 7.5L8.5 9.5L12 4L14 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity=".7" />
      <rect x="1" y="13" width="14" height="1.5" rx=".75" fill="currentColor" opacity=".5" />
    </svg>
  );
}

function IconBudgets() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" opacity=".7" />
      <line x1="1.5" y1="6.5" x2="14.5" y2="6.5" stroke="currentColor" strokeWidth="1.3" opacity=".5" />
      <circle cx="5" cy="10" r="1" fill="currentColor" opacity=".6" />
    </svg>
  );
}

function IconVendors() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="7" width="12" height="8" rx="1" fill="currentColor" opacity=".7" />
      <path d="M5 7V5.5C5 3.57 6.34 2 8 2C9.66 2 11 3.57 11 5.5V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="6.5" y="9" width="3" height="2.5" rx="0.5" fill="white" />
    </svg>
  );
}

function IconBriefing() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" opacity=".7" />
      <line x1="8" y1="4" x2="8" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="8.5" x2="10.5" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconRecommendations() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1L9.8 5.4L14.5 5.9L11.1 9L12.1 13.6L8 11.2L3.9 13.6L4.9 9L1.5 5.9L6.2 5.4L8 1Z" fill="currentColor" opacity=".7" />
    </svg>
  );
}
