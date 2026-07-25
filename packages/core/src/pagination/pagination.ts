export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export interface PageRequest {
  page?: number;
  pageSize?: number;
}

export interface NormalizedPageRequest {
  page: number;
  pageSize: number;
  skip: number;
}

export interface Page<T> {
  items: readonly T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export function normalizePageRequest(request: PageRequest = {}): NormalizedPageRequest {
  const requestedPage = request.page ?? 1;
  const requestedPageSize = request.pageSize ?? DEFAULT_PAGE_SIZE;
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const pageSize =
    Number.isInteger(requestedPageSize) && requestedPageSize > 0
      ? Math.min(requestedPageSize, MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function createPage<T>(
  items: readonly T[],
  request: NormalizedPageRequest,
  totalItems: number,
): Page<T> {
  return {
    items,
    page: request.page,
    pageSize: request.pageSize,
    totalItems,
    totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / request.pageSize),
  };
}
