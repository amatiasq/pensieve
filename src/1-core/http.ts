import { busyWhile } from './busy-indicator.ts';

export type RequestBody = Record<string, unknown> | string | null;

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
    signal: AbortSignal.timeout(30_000),
    ...extras,
    body,
  } as FetchOptions;

  return busyWhile(
    fetch(url, options)
      .then(x => Promise.all([x, x.text()]))
      .then(([response, body]) => {
        handleHttpErrors(response.status, url, body);
        return isJsonResponse(response)
          ? (JSON.parse(body) as Promise<T>)
          : (body as unknown as Promise<T>);
      }),
  );
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

export class HttpError extends Error {
  constructor(readonly status: number, message: string, readonly body: string) {
    super(`${status}: ${message}`);
  }
}

const httpStatuses: Record<number, string> = {
  100: 'Continue',
  101: 'Switching Protocol',
  102: 'Processing',
  103: 'Early Hints',
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  203: 'Non-Authoritative Information',
  204: 'No Content',
  205: 'Reset Content',
  206: 'Partial Content',
  207: 'Multi-Status',
  208: 'Already Reported',
  226: 'IM Used',
  300: 'Multiple Choice',
  301: 'Moved Permanently',
  302: 'Found',
  303: 'See Other',
  304: 'Not Modified',
  305: 'Use Proxy',
  306: 'unused',
  307: 'Temporary Redirect',
  308: 'Permanent Redirect',
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Payload Too Large',
  414: 'URI Too Long',
  415: 'Unsupported Media Type',
  416: 'Range Not Satisfiable',
  417: 'Expectation Failed',
  418: "I'm a teapot",
  421: 'Misdirected Request',
  422: 'Unprocessable Entity',
  423: 'Locked',
  424: 'Failed Dependency',
  425: 'Too Early',
  426: 'Upgrade Required',
  428: 'Precondition Required',
  429: 'Too Many Requests',
  431: 'Request Header Fields Too Large',
  451: 'Unavailable For Legal Reasons',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  505: 'HTTP Version Not Supported',
  506: 'Variant Also Negotiates',
  507: 'Insufficient Storage',
  508: 'Loop Detected',
  510: 'Not Extended',
  511: 'Network Authentication Required',
};

function handleHttpErrors(status: number, url: string, body: string) {
  const hundred = Math.floor(status / 100);
  let message = httpStatuses[status];

  console.debug(`HTTP[${status} ${message}]: ${url}`);

  // 1XX 2XX and 3XX are ok
  if (hundred < 4) {
    return;
  }

  if (!message) {
    if (hundred === 4) {
      message = 'Unknown client error';
    } else if (hundred === 5) {
      message = 'Unknown server error';
    }
  }

  throw new HttpError(status, message || 'Unknown status', body);
}
