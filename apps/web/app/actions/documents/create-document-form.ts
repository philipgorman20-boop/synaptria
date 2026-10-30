import { ApplicationError } from '@synaptria/application';
import { AuthorizationDeniedError } from '@synaptria/core/errors';
import type { DocumentType } from '@synaptria/domain/documents';

export interface CreateDocumentActionState {
  readonly status: 'idle' | 'error';
  readonly message?: string;
  readonly fieldErrors?: Readonly<{ title?: string; type?: string; sourceUrl?: string }>;
  readonly values?: Readonly<{ title: string; type: string; description: string; sourceUrl: string; programId: string; projectId: string }>;
}

export interface CreateDocumentFormValues {
  readonly title: string;
  readonly type: string;
  readonly description: string;
  readonly sourceUrl: string;
  readonly programId: string;
  readonly projectId: string;
}

export const initialCreateDocumentState: CreateDocumentActionState = { status: 'idle' };

export function readCreateDocumentFormValues(formData: FormData): CreateDocumentFormValues {
  return {
    title: readText(formData, 'title'),
    type: readText(formData, 'type'),
    description: readText(formData, 'description'),
    sourceUrl: readText(formData, 'sourceUrl'),
    programId: readText(formData, 'programId'),
    projectId: readText(formData, 'projectId'),
  };
}

export function validateCreateDocumentFormValues(
  values: CreateDocumentFormValues,
): CreateDocumentActionState | undefined {
  const fieldErrors: { title?: string; type?: string } = {};

  if (values.title.trim().length === 0) fieldErrors.title = 'Document title is required.';
  if (values.type.trim().length === 0) fieldErrors.type = 'Document type is required.';

  if (Object.keys(fieldErrors).length === 0) return undefined;

  return { status: 'error', message: 'Correct the highlighted fields and try again.', fieldErrors, values };
}

export function mapCreateDocumentActionError(
  error: unknown,
  values: CreateDocumentFormValues,
): CreateDocumentActionState | undefined {
  if (error instanceof AuthorizationDeniedError) {
    return { status: 'error', message: 'You do not have permission to upload documents.', values };
  }
  if (error instanceof ApplicationError) {
    const fieldErrors = error.details?.field === 'title' ? { title: error.message } : undefined;
    return {
      status: 'error',
      message: fieldErrors === undefined ? error.message : 'Correct the highlighted fields and try again.',
      ...(fieldErrors === undefined ? {} : { fieldErrors }),
      values,
    };
  }
  return undefined;
}

export function isDocumentType(value: string): value is DocumentType {
  return [
    'GENERAL', 'CONTRACT', 'SOW', 'QUOTE', 'PURCHASE_ORDER', 'INVOICE',
    'PROTOCOL', 'REPORT', 'PRESENTATION', 'MEETING_NOTES', 'BOARD_MATERIAL',
    'INVESTOR_MATERIAL', 'REGULATORY', 'IP', 'POLICY', 'OTHER',
  ].includes(value);
}

function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === 'string' ? value.trim() : '';
}
