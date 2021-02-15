export type RequestBody = Record<string, any> | string | null;

type FetchOptions = NonNullable<Parameters<typeof fetch>[1]>;

export type RequestOptions = Omit<FetchOptions, 'body'> & {
  body?: RequestBody;
};

function request<T>(url: string, extras: RequestOptions = {}) {
  const body =
    'body' in extras && typeof extras.body !== 'string'
      ? JSON.stringify(extras.body)
      : extras.body;

  const options = {
    ...extras,
    body,
  } as FetchOptions;

  return fetch(url, options).then(x => {
    if (x.status === 404) {
      throw new Error('Not found');
    }

    return isJsonResponse(x)
      ? (x.json() as Promise<T>)
      : ((x.text() as unknown) as Promise<T>);
  });
}

export const GET = <T>(url: string, options: RequestOptions = {}) =>
  request<T>(url, options);

export const POST = <T>(
  url: string,
  body: RequestBody = null,
  options: RequestOptions = {},
) => request<T>(url, { method: 'POST', body, ...options });

export const PUT = <T>(
  url: string,
  body: RequestBody = null,
  options: RequestOptions = {},
) => request<T>(url, { method: 'PUT', body, ...options });

export const PATCH = <T>(
  url: string,
  body: RequestBody = null,
  options: RequestOptions = {},
) => request<T>(url, { method: 'PATCH', body, ...options });

export const DELETE = <T>(url: string, options: RequestOptions = {}) =>
  request<T>(url, { method: 'DELETE', ...options });

function isJsonResponse(response: Response) {
  const type = response.headers.get('content-type');
  return type ? type.toLowerCase().includes('application/json') : false;
}
