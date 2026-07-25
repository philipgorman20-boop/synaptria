import type { Program } from '@synaptria/domain/programs';

import { ProgramCard } from './program-card';

export interface ProgramsListProps {
  readonly programs: readonly Program[];
}

export function ProgramsList({ programs }: ProgramsListProps) {
  return (
    <section className="programs-list" aria-label="Programs">
      {programs.map((program) => (
        <ProgramCard key={program.id} program={program} />
      ))}
    </section>
  );
}
