import { Stack } from '@synaptria/ui';

import { CreateProgramDialog } from './create-program-dialog';

export function ProgramsEmptyState() {
  return (
    <section className="programs-empty-state" aria-labelledby="programs-empty-heading">
      <Stack gap={12}>
        <p className="eyebrow">PORTFOLIO</p>
        <h2 id="programs-empty-heading">No programs yet</h2>
        <p>
          Programs group related projects under a strategic initiative. When
          programs are created for this organization, they will appear here.
        </p>
        <div className="programs-empty-state-actions">
          <CreateProgramDialog triggerLabel="Create your first program" />
        </div>
      </Stack>
    </section>
  );
}
