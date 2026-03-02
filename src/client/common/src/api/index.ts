import { authManager } from '../services/auth/authManager';

export { ApiError } from './ApiError';
export { 
  handleApiError, 
  handleValidationError,
  isErrorCode,
  getErrorMessage,
  isRetryableError,
  logError,
} from './errorHandling';
export { expect, makePageQueryString } from './utils';

const APPLICATION_JSON = 'application/json';

export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

let schemeHost: string;
let accessToken: string;
let acceptLanguage: string;

export const setSchemeHost = (host: string) => schemeHost = host;
export const setAccessToken = (token: string) => accessToken = token;
export const setAcceptLanguage = (language: string) => acceptLanguage = language;

export const apiUrl = (path: string) => {
  // When running behind a proxy (same-origin), schemeHost may be empty.
  // In this case, return the path as-is for relative URL resolution.
  if (!schemeHost) {
    return path.startsWith('/') ? path : `/${path}`;
  }
  if (import.meta.env.DEV) {
    // This should be blank when using the development proxy.
    // This will result in cookies not being set for the client port on login.
    console.warn('🔐 [API] schemeHost:', schemeHost);
  }
  return buildPath(schemeHost, path);
};

export const get = (input: RequestInfo | URL, signal?: AbortSignal) =>
  fetchJson(input, 'GET', signal);

export const post = <T>(input: RequestInfo | URL, body: T, signal?: AbortSignal) =>
  fetchJsonBody(input, 'POST', body, signal);

export const put = <T>(input: RequestInfo | URL, body: T, signal?: AbortSignal) =>
  fetchJsonBody(input, 'PUT', body, signal);

export const patch = <T>(input: RequestInfo | URL, body: T, signal?: AbortSignal) =>
  fetchJsonBody(input, 'PATCH', body, signal);

export const del = (input: RequestInfo | URL, signal?: AbortSignal) =>
  fetchJson(input, 'DELETE', signal);

export const getModel = <M>(input: RequestInfo | URL, signal?: AbortSignal): Promise<Result<M, Response>> =>
  fetchJsonModel(input, 'GET', signal);

export const postModel = <T, M>(input: RequestInfo | URL, body: T, signal?: AbortSignal): Promise<Result<M, Response>> =>
  fetchJsonBodyModel(input, 'POST', body, signal);

export const putModel = <T, M>(input: RequestInfo | URL, body: T, signal?: AbortSignal): Promise<Result<M, Response>> =>
  fetchJsonBodyModel(input, 'PUT', body, signal);

export const patchModel = <T, M>(input: RequestInfo | URL, body: T, signal?: AbortSignal): Promise<Result<M, Response>> =>
  fetchJsonBodyModel(input, 'PATCH', body, signal);

export const delModel = <M>(input: RequestInfo | URL, signal?: AbortSignal): Promise<Result<M, Response>> =>
  fetchJsonModel(input, 'DELETE', signal);

export const postMultipart = (input: RequestInfo | URL, formData: FormData, signal?: AbortSignal) =>
  fetchMultipart(input, 'POST', formData, signal);

export const putMultipart = (input: RequestInfo | URL, formData: FormData, signal?: AbortSignal) =>
  fetchMultipart(input, 'PUT', formData, signal);

export const postFormData = <M>(input: RequestInfo | URL, formData: FormData, signal?: AbortSignal): Promise<Result<M, Response>> =>
  fetchMultipartModel(input, 'POST', formData, signal);

const fetchJson = (input: RequestInfo | URL, method: string, signal?: AbortSignal) => {
  const headers: HeadersInit = {
    Accept: APPLICATION_JSON,
  };

  if (acceptLanguage) {
    headers['Accept-Language'] = acceptLanguage;
  }

  const init: RequestInit = {
    headers,
    method,
    signal,
  };

  return fetchAuth(input, init);
};

const fetchJsonModel = async <M>(input: RequestInfo | URL, method: string, signal?: AbortSignal): Promise<Result<M, Response>> => {
  var response = await fetchJson(input, method, signal)
  if (response.ok) {
    // Handle 204 No Content - no body to parse
    if (response.status === 204) {
      return { ok: true, value: undefined as M };
    }
    return { ok: true, value: await response.json() as M };
  }

  return { ok: false, error: response };
}

const fetchJsonBody = <T>(input: RequestInfo | URL, method: string, body: T, signal?: AbortSignal) => {
  const headers: HeadersInit = {
    Accept: APPLICATION_JSON,
    'Content-Type': APPLICATION_JSON
  };

  if (acceptLanguage) {
    headers['Accept-Language'] = acceptLanguage;
  }

  const init: RequestInit = {
    headers,
    method,
    body: JSON.stringify(body),
    signal,
  };

  return fetchAuth(input, init);
};

const fetchJsonBodyModel = async <T, M>(input: RequestInfo | URL, method: string, body: T, signal?: AbortSignal): Promise<Result<M, Response>> => {
  var response = await fetchJsonBody(input, method, body, signal)
  if (response.ok) {
    // Handle 204 No Content - no body to parse
    if (response.status === 204) {
      return { ok: true, value: undefined as M };
    }
    return { ok: true, value: await response.json() as M };
  }

  return { ok: false, error: response };
}

const fetchMultipart = (input: RequestInfo | URL, method: string, formData: FormData, signal?: AbortSignal) => {
  const headers: HeadersInit = {
    Accept: APPLICATION_JSON,
    // Don't set Content-Type for FormData - browser will set it with boundary
  };

  if (acceptLanguage) {
    headers['Accept-Language'] = acceptLanguage;
  }

  const init: RequestInit = {
    headers,
    method,
    body: formData,
    signal,
  };

  return fetchAuth(input, init);
};

const fetchMultipartModel = async <M>(input: RequestInfo | URL, method: string, formData: FormData, signal?: AbortSignal): Promise<Result<M, Response>> => {
  var response = await fetchMultipart(input, method, formData, signal)
  if (response.ok) {
    // Handle 204 No Content - no body to parse
    if (response.status === 204) {
      return { ok: true, value: undefined as M };
    }
    return { ok: true, value: await response.json() as M };
  }

  return { ok: false, error: response };
}

export const fetchAuth = async (input: RequestInfo | URL, init?: RequestInit) => {
  init ||= {};
  init.headers ||= {};

  if (import.meta.env.VITE_AUTH_TYPE === 'bearer') {
    setAuthorizationHeader(init.headers as Record<string, string>);
  } else {
    init.credentials = 'same-origin';
  }

  const response = await fetch(resolveUrl(input), init);

  // Global 401 error handling
  if (response.status === 401) {
    authManager.triggerLogout();
  }

  return response;
};

const setAuthorizationHeader = (headers: Record<string, string>) => {
  if (accessToken) {
    headers['Authorization'] = 'Bearer ' + accessToken;
  }
};

const resolveUrl = (input: RequestInfo | URL) => {
  // We go against the host itself with absolute paths.
  if (typeof input === 'string') {
    if (input.startsWith('/')) {
      input = apiUrl(input);
    }
  }

  return input;
};

// https://stackoverflow.com/questions/29855098/is-there-a-built-in-javascript-function-similar-to-os-path-join/46427607#46427607
const buildPath = (...args: string[]) => {
  return args
    .map((part, i) => {
      if (!part) {
        throw new Error("Path segment isn't defined.");
      }

      if (i === 0) {
        return part.trim().replace(/[\/]*$/g, '');
      } else {
        return part.trim().replace(/(^[\/]*|[\/]*$)/g, '');
      }
    })
    .filter(x => x.length)
    .join('/');
};
