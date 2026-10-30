import type { CreateVendorContext, CreateVendorInput, CreateVendorOutput } from './create-vendor';
import { CreateVendorUseCase } from './create-vendor';
import type { GetVendorContext, GetVendorInput, GetVendorOutput } from './get-vendor';
import { GetVendorUseCase } from './get-vendor';
import type { ListVendorsContext, ListVendorsOutput } from './list-vendors';
import { ListVendorsUseCase } from './list-vendors';
import type { UpdateVendorContext, UpdateVendorInput, UpdateVendorOutput } from './update-vendor';
import { UpdateVendorUseCase } from './update-vendor';
import type { DeleteVendorContext, DeleteVendorInput, DeleteVendorOutput } from './delete-vendor';
import { DeleteVendorUseCase } from './delete-vendor';

export class VendorService {
  constructor(
    private readonly createVendorUseCase: CreateVendorUseCase,
    private readonly listVendorsUseCase: ListVendorsUseCase,
    private readonly getVendorUseCase: GetVendorUseCase,
    private readonly updateVendorUseCase: UpdateVendorUseCase,
    private readonly deleteVendorUseCase: DeleteVendorUseCase,
  ) {}

  createVendor(context: CreateVendorContext, input: CreateVendorInput): Promise<CreateVendorOutput> {
    return this.createVendorUseCase.execute(context, input);
  }

  listVendors(context: ListVendorsContext): Promise<ListVendorsOutput> {
    return this.listVendorsUseCase.execute(context);
  }

  getVendor(context: GetVendorContext, input: GetVendorInput): Promise<GetVendorOutput> {
    return this.getVendorUseCase.execute(context, input);
  }

  updateVendor(context: UpdateVendorContext, input: UpdateVendorInput): Promise<UpdateVendorOutput> {
    return this.updateVendorUseCase.execute(context, input);
  }

  deleteVendor(context: DeleteVendorContext, input: DeleteVendorInput): Promise<DeleteVendorOutput> {
    return this.deleteVendorUseCase.execute(context, input);
  }
}
