import assert from 'node:assert/strict';
import test from 'node:test';

import { createPage, normalizePageRequest } from './pagination';

test('normalizePageRequest applies defaults and caps page size', () => {
  assert.deepEqual(normalizePageRequest(), { page: 1, pageSize: 25, skip: 0 });
  assert.deepEqual(normalizePageRequest({ page: 3, pageSize: 500 }), {
    page: 3,
    pageSize: 100,
    skip: 200,
  });
});

test('createPage calculates total pages', () => {
  const request = normalizePageRequest({ page: 2, pageSize: 10 });
  assert.deepEqual(createPage(['a'], request, 21), {
    items: ['a'],
    page: 2,
    pageSize: 10,
    totalItems: 21,
    totalPages: 3,
  });
});
