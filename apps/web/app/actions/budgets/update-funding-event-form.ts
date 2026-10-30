export interface UpdateFundingEventFormValues {
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

export interface UpdateFundingEventActionState {
  readonly status: 'idle' | 'error' | 'success';
  readonly message?: string;
  readonly fieldErrors?: Partial<Record<keyof UpdateFundingEventFormValues, string>>;
  readonly values?: UpdateFundingEventFormValues;
}

export const initialUpdateFundingEventState: UpdateFundingEventActionState = { status: 'idle' };

export function readUpdateFundingEventFormValues(formData: FormData): UpdateFundingEventFormValues {
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

export function validateUpdateFundingEventFormValues(
  values: UpdateFundingEventFormValues,
): UpdateFundingEventActionState | undefined {
  const fieldErrors: Partial<Record<keyof UpdateFundingEventFormValues, string>> = {};

  if (values.name.trim().length === 0) fieldErrors.name = 'Name is required.';
  if (values.amount.trim().length > 0 && (isNaN(parseFloat(values.amount)) || parseFloat(values.amount) <= 0)) {
    fieldErrors.amount = 'Amount must be a positive number.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { status: 'error', message: 'Correct the highlighted fields and try again.', fieldErrors, values };
  }
}

export function mapUpdateFundingEventActionError(
  error: unknown,
  values: UpdateFundingEventFormValues,
): UpdateFundingEventActionState | undefined {
  void error;
  void values;
  return undefined;
}
