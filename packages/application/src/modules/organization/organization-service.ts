import type {
  CreateOrganizationContext,
  CreateOrganizationInput,
  CreateOrganizationOutput,
} from './create-organization';
import { CreateOrganizationUseCase } from './create-organization';
import type {
  ListOrganizationsContext,
  ListOrganizationsOutput,
} from './list-organizations';
import { ListOrganizationsUseCase } from './list-organizations';
import type {
  SwitchOrganizationContext,
  SwitchOrganizationInput,
  SwitchOrganizationResult,
} from './switch-organization';
import { SwitchOrganizationUseCase } from './switch-organization';

/** Application facade consumed by delivery mechanisms such as Next.js. */
export class OrganizationService {
  constructor(
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly listOrganizationsUseCase: ListOrganizationsUseCase,
    private readonly switchOrganizationUseCase: SwitchOrganizationUseCase,
  ) {}

  createOrganization(
    context: CreateOrganizationContext,
    input: CreateOrganizationInput,
  ): Promise<CreateOrganizationOutput> {
    return this.createOrganizationUseCase.execute(context, input);
  }

  listOrganizations(
    context: ListOrganizationsContext,
  ): Promise<ListOrganizationsOutput> {
    return this.listOrganizationsUseCase.execute(context);
  }

  switchOrganization(
    context: SwitchOrganizationContext,
    input: SwitchOrganizationInput,
  ): Promise<SwitchOrganizationResult> {
    return this.switchOrganizationUseCase.execute(context, input);
  }
}
