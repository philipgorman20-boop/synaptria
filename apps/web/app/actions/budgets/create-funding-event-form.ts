export interface CreateFundingEventFormValues {
  readonly name: string;
  readonly type: string;
  readonly status: string;
  readonly amount: string;
  readonly currency: string;
  readonly receivedAt: string;
  readonly expectedAt: string;
  readonly investor: string;
  readonly notes: string;
}

export interface CreateFundingEventActionState {
  readonly status: 'idle' | 'error';
  readonly message?: string;
  readonly fieldErrors?: Partial<Record<keyof CreateFundingEventFormValues, string>>;
  readonly values?: CreateFundingEventFormValues;
}

export const initialCreateFundingEventState: CreateFundingEventActionState = { status: 'idle' };

export function readCreateFundingEventFormValues(formData: FormData): CreateFundingEventFormValues {
  return {
    name: String(formData.get('name') ?? ''),
    type: String(formData.get('type') ?? ''),
    status: String(formData.get('status') ?? ''),
    amount: String(formData.get('amount') ?? ''),
    currency: String(formData.get('currency') ?? ''),
    receivedAt: String(formData.get('receivedAt') ?? ''),
    expectedAt: String(formData.get('expectedAt') ?? ''),
    investor: String(formData.get('investor') ?? ''),
    notes: String(formData.get('notes') ?? ''),
  };
}

export function validateCreateFundingEventFormValues(
  values: CreateFundingEventFormValues,
): CreateFundingEventActionState | undefined {
  const fieldErrors: Partial<Record<keyof CreateFundingEventFormValues, string>> = {};

  if (values.name.trim().length === 0) fieldErrors.name = 'Name is required.';
  if (values.type.length === 0) fieldErrors.type = 'Type is required.';
  if (values.amount.trim().length === 0) fieldErrors.amount = 'Amount is required.';
  else if (isNaN(parseFloat(values.amount)) || parseFloat(values.amount) <= 0) {
    fieldErrors.amount = 'Amount must be a positive number.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { status: 'error', message: 'Correct the highlighted fields and try again.', fieldErrors, values };
  }
}

export function mapCreateFundingEventActionError(
  error: unknown,
  values: CreateFundingEventFormValues,
): CreateFundingEventActionState | undefined {
  void error;
  void values;
  return undefined;
}
