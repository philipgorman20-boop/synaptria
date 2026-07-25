import type { Program } from '@synaptria/domain/programs';
import { routes } from '@synaptria/config';
import Link from 'next/link';

import { ProgramPriorityBadge } from './program-priority-badge';
import { ProgramStatusBadge } from './program-status-badge';

export interface ProgramDetailHeaderProps {
  readonly program: Program;
}

export function ProgramDetailHeader({ program }: ProgramDetailHeaderProps) {
  return (
    <header className="program-detail-header">
      <nav aria-label="Program navigation" className="program-detail-nav">
        <Link className="program-detail-back-link" href={routes.programs}>
          Programs
        </Link>
        <span aria-hidden="true" className="program-detail-nav-separator">
          /
        </span>
        <span aria-current="page">{program.name}</span>
      </nav>

      <div className="program-detail-heading">
        <div className="program-detail-title-group">
          <p className="eyebrow">PROGRAM</p>
          <h1>{program.name}</h1>
          {program.code !== undefined ? (
            <p className="program-card-code">{program.code}</p>
          ) : null}
          {program.description !== undefined ? (
            <p className="program-detail-description">{program.description}</p>
          ) : null}
        </div>

        <div className="program-card-badges program-detail-badges">
          <ProgramStatusBadge status={program.status} />
          <ProgramPriorityBadge priority={program.priority} />
        </div>
      </div>
    </header>
  );
}
