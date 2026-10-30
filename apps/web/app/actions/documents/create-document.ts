'use server';

import { routes } from '@synaptria/config';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { programId, projectId } from '@synaptria/core';
import { toCreateDocumentContext } from '../../../lib/document-context';
import { getRequestContext } from '../../../lib/request-context';
import { getDocumentService } from '../../../lib/document-service';

import {
  isDocumentType,
  mapCreateDocumentActionError,
  readCreateDocumentFormValues,
  validateCreateDocumentFormValues,
  type CreateDocumentActionState,
} from './create-document-form';

export async function createDocumentAction(
  _previousState: CreateDocumentActionState,
  formData: FormData,
): Promise<CreateDocumentActionState> {
  const values = readCreateDocumentFormValues(formData);
  const validation = validateCreateDocumentFormValues(values);

  if (validation !== undefined) return validation;

  if (!isDocumentType(values.type)) {
    return {
      status: 'error',
      message: 'Invalid document type.',
      fieldErrors: { type: 'Please select a valid document type.' },
      values,
    };
  }

  try {
    const context = await getRequestContext();
    await getDocumentService().createDocument(toCreateDocumentContext(context), {
      title: values.title,
      type: values.type,
      ...(values.description.length === 0 ? {} : { description: values.description }),
      ...(values.sourceUrl.length === 0 ? {} : { sourceUrl: values.sourceUrl }),
      ...(values.programId.length > 0 ? { programId: programId(values.programId) } : {}),
      ...(values.projectId.length > 0 ? { projectId: projectId(values.projectId) } : {}),
    });

    revalidatePath(routes.documents);
    revalidatePath(routes.dashboard);
  } catch (error) {
    const mapped = mapCreateDocumentActionError(error, values);
    if (mapped !== undefined) return mapped;

    return {
      status: 'error',
      message: 'The document could not be created. Please try again.',
      values,
    };
  }

  redirect(routes.documents);
}
