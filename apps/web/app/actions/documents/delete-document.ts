'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { routes } from '@synaptria/config';
import type { DocumentId } from '@synaptria/core';

import { toDeleteDocumentContext } from '../../../lib/document-context';
import { getRequestContext } from '../../../lib/request-context';
import { getDocumentService } from '../../../lib/document-service';
import type { DeleteDocumentActionState } from './delete-document-form';

export async function deleteDocumentAction(
  documentId: DocumentId,
  _previousState: DeleteDocumentActionState,
): Promise<DeleteDocumentActionState> {
  try {
    const context = await getRequestContext();
    await getDocumentService().deleteDocument(toDeleteDocumentContext(context), { documentId });
    revalidatePath(routes.documents);
  } catch {
    return { status: 'error', message: 'The document could not be deleted. Please try again.' };
  }

  redirect(routes.documents);
}
