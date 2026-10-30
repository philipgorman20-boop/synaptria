'use server';

import { documentRoute, routes } from '@synaptria/config';
import { programId, projectId, type DocumentId } from '@synaptria/core';
import { revalidatePath } from 'next/cache';

import { toUpdateDocumentContext } from '../../../lib/document-context';
import { getRequestContext } from '../../../lib/request-context';
import { getDocumentService } from '../../../lib/document-service';

import {
  isDocumentStatus,
  isDocumentType,
  mapUpdateDocumentActionError,
  readUpdateDocumentFormValues,
  validateUpdateDocumentFormValues,
  type UpdateDocumentActionState,
} from './update-document-form';

export async function updateDocumentAction(
  documentId: DocumentId,
  _previousState: UpdateDocumentActionState,
  formData: FormData,
): Promise<UpdateDocumentActionState> {
  const values = readUpdateDocumentFormValues(formData);
  const validation = validateUpdateDocumentFormValues(values);

  if (validation !== undefined) return validation;

  try {
    const context = await getRequestContext();
    await getDocumentService().updateDocument(toUpdateDocumentContext(context), {
      documentId,
      title: values.title,
      ...(isDocumentType(values.type) ? { type: values.type } : {}),
      ...(isDocumentStatus(values.status) ? { status: values.status } : {}),
      ...(values.description.length > 0 ? { description: values.description } : { description: null }),
      ...(values.sourceUrl.length > 0 ? { sourceUrl: values.sourceUrl } : { sourceUrl: null }),
      programId: values.programId.length > 0 ? programId(values.programId) : null,
      projectId: values.projectId.length > 0 ? projectId(values.projectId) : null,
    });

    revalidatePath(routes.documents);
    revalidatePath(documentRoute(documentId));
  } catch (error) {
    const mapped = mapUpdateDocumentActionError(error, values);
    if (mapped !== undefined) return mapped;

    return {
      status: 'error',
      message: 'The document could not be updated. Please try again.',
      values,
    };
  }

  return { status: 'success' };
}
