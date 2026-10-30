export interface CreateOrganizationActionState {
  readonly status: 'idle' | 'error';
  readonly message?: string;
  readonly fieldErrors?: Readonly<{
    name?: string;
    slug?: string;
  }>;
  readonly values?: Readonly<CreateOrganizationFormValues>;
}

export interface CreateOrganizationFormValues {
  readonly name: string;
  readonly slug: string;
}

export const initialCreateOrganizationState: CreateOrganizationActionState = {
  status: 'idle',
};

export function readCreateOrganizationFormValues(
  formData: FormData,
): CreateOrganizationFormValues {
  return {
    name: readText(formData, 'name'),
    slug: readText(formData, 'slug'),
  };
}

export function validateCreateOrganizationFormValues(
  values: CreateOrganizationFormValues,
): CreateOrganizationActionState | undefined {
  const fieldErrors: { name?: string; slug?: string } = {};
  const name = values.name.trim();
  const slug = values.slug.trim();

  if (name.length === 0) {
    fieldErrors.name = 'Organization name is required.';
  }

  if (slug.length === 0) {
    fieldErrors.slug = 'Workspace slug is required.';
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    fieldErrors.slug =
      'Use lowercase letters, numbers, and single hyphens only.';
  }

  if (Object.keys(fieldErrors).length === 0) {
    return undefined;
  }

  return {
    status: 'error',
    message: 'Correct the highlighted fields and try again.',
    fieldErrors,
    values: { name, slug },
  };
}

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}
