import type { Program } from '@synaptria/domain/programs';
import { Card, Stack } from '@synaptria/ui';
import Link from 'next/link';

import { formatProgramDate, getProgramDetailHref } from '../programs-format';

import { ProgramPriorityBadge } from './program-priority-badge';
import { ProgramStatusBadge } from './program-status-badge';

export interface ProgramCardProps {
  readonly program: Program;
}

export function ProgramCard({ program }: ProgramCardProps) {
  return (
    <Link
      className="program-card-link"
      href={getProgramDetailHref(program.id)}
    >
      <Card className="program-card">
        <Stack gap={12}>
          <div className="program-card-header">
            <div className="program-card-title-group">
              <h2 className="program-card-title">{program.name}</h2>
              {program.code !== undefined ? (
                <p className="program-card-code">{program.code}</p>
              ) : null}
            </div>
            <div className="program-card-badges">
              <ProgramStatusBadge status={program.status} />
              <ProgramPriorityBadge priority={program.priority} />
            </div>
          </div>

          <dl className="program-card-details">
            {program.indication !== undefined ? (
              <div className="program-card-detail">
                <dt>Indication</dt>
                <dd>{program.indication}</dd>
              </div>
            ) : null}
            {program.target !== undefined ? (
              <div className="program-card-detail">
                <dt>Target</dt>
                <dd>{program.target}</dd>
              </div>
            ) : null}
            {program.targetEndDate !== undefined ? (
              <div className="program-card-detail">
                <dt>Target end</dt>
                <dd>{formatProgramDate(program.targetEndDate)}</dd>
              </div>
            ) : null}
          </dl>
        </Stack>
      </Card>
    </Link>
  );
}
