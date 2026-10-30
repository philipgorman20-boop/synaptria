import { routes } from '@synaptria/config';
import type { Decision } from '@synaptria/domain/decisions';
import Link from 'next/link';
import type React from 'react';

import { formatDecisionStatus } from '../decisions-format';

export interface DecisionDetailHeaderProps {
  readonly decision: Decision;
  readonly actions?: React.ReactNode;
}

export function DecisionDetailHeader({ decision, actions }: DecisionDetailHeaderProps) {
  return (
    <header className="detail-header">
      <nav aria-label="Decision navigation" className="detail-breadcrumb">
        <Link className="detail-back-link" href={routes.decisions}>Decisions</Link>
        <span aria-hidden="true" className="detail-breadcrumb-separator">/</span>
        <span aria-current="page">{decision.title}</span>
      </nav>

      <div className="detail-heading">
        <div className="detail-title-group">
          <p className="eyebrow">DECISION</p>
          <h1>{decision.title}</h1>
          {decision.context !== undefined ? (
            <p className="detail-description">{decision.context}</p>
          ) : null}
        </div>
        <div className="detail-heading-aside">
          <span className="detail-status-badge">{formatDecisionStatus(decision.status)}</span>
          {actions}
        </div>
      </div>
    </header>
  );
}
