export const HTTP_FAILURE = 'http/failure';

export type HttpFailure = {
  type: typeof HTTP_FAILURE;
  status: number;
};

export function httpFailure(status: number): HttpFailure {
  return {
    type: HTTP_FAILURE,
    status,
  };
}
