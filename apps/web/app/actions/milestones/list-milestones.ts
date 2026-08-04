'use server';

import type {
  ListMilestonesOutput,
} from '@synaptria/application';

import { toListMilestonesContext } from '../../../lib/milestone-context';
import { getMilestoneService } from '../../../lib/milestone-service';
import { getRequestContext } from '../../../lib/request-context';

export async function listMilestonesAction(): Promise<ListMilestonesOutput> {
  const context = await getRequestContext();

  return getMilestoneService().listMilestones(
    toListMilestonesContext(context),
  );
}
