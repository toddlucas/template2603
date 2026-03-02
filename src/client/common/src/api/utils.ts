import type { PagedQuery } from '../models';

export const REQUEST_ID_PARAM = "{id}";

/**
 * Converts a PageQuery model into a query string, for pagination.
 */
export const makePageQueryString = (pageQuery: PagedQuery, defaultTake: number = 25) =>
  "?" + makePageQuery(pageQuery, defaultTake)

/**
 * Converts a PageQuery model into a query string, for pagination.
 */
export function makePageQuery(pageQuery: PagedQuery, defaultLimit: number = 25) {
  const params: string[] = [];

  if (pageQuery.cursor) {
    params.push(`cursor=${pageQuery.cursor}`);
  } else if (pageQuery.page >= 1) {
    // Page is 1-based.
    params.push(`page=${pageQuery.page}`);
  } else {
    if (process.env.NODE_ENV === 'development') {
      alert(`Page is 1-based. If not provided, fall back to take-based pagination.`);
      console.error(`Page is 1-based. If not provided, fall back to take-based pagination.`);
    }
    else {
      console.warn(`Page is 1-based. If not provided, fall back to take-based pagination.`);
    }
    params.push(`page=1`);
  }

  if (pageQuery.limit) {
    params.push(`limit=${pageQuery.limit}`);
  }
  else {
    params.push(`limit=${defaultLimit}`);
  }

  if (pageQuery.search) {
    params.push(`search=${encodeURIComponent(pageQuery.search)}`);
  }

  if (pageQuery.column?.length) {
    pageQuery.column.forEach(col => {
      params.push(`column=${encodeURIComponent(col)}`);
    });
  }

  if (pageQuery.direction?.length) {
    pageQuery.direction.forEach(dir => {
      params.push(`direction=${encodeURIComponent(dir)}`);
    });
  }

  return params.join('&');
}

/**
 * Ensures that a parameter of the form "{param}" exists in the URL template.
 */
export function expect(template: string, parameter: string) {
  if (process.env.NODE_ENV === 'development') {
      if (template.indexOf(parameter) >= 0) {
          return true;
      }

      alert(`Parameter ${parameter} not found for template="${template}"`);
  }
  else {
      console.warn(`Parameter ${parameter} not found for template="${template}"`);
  }
}
