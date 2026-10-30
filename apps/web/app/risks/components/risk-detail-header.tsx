import { routes } from '@synaptria/config';
import type { Risk } from '@synaptria/domain/risks';
import Link from 'next/link';
import type React from 'react';

import { formatRiskCategory, formatRiskStatus } from '../risks-format';

export interface RiskDetailHeaderProps {
  readonly risk: Risk;
  readonly actions?: React.ReactNode;
}

export function RiskDetailHeader({ risk, actions }: RiskDetailHeaderProps) {
  return (
    <header className="detail-header">
      <nav aria-label="Risk navigation" className="detail-breadcrumb">
        <Link className="detail-back-link" href={routes.risks}>Risks</Link>
        <span aria-hidden="true" className="detail-breadcrumb-separator">/</span>
        <span aria-current="page">{risk.title}</span>
      </nav>

      <div className="detail-heading">
        <div className="detail-title-group">
          <p className="eyebrow">RISK · {formatRiskCategory(risk.category)}</p>
          <h1>{risk.title}</h1>
          {risk.description !== undefined ? (
            <p className="detail-description">{risk.description}</p>
          ) : null}
        </div>
        <div className="detail-heading-aside">
          <span className="detail-status-badge">{formatRiskStatus(risk.status)}</span>
          {actions}
        </div>
      </div>
    </header>
  );
}
