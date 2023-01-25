const encode = encodeURIComponent;
const decode = decodeURIComponent;

export function withParams(
  path: string,
  params: Record<string, string | number | boolean> = {},
) {
  const query = Object.entries(params)
    .map(([key, value]) => `${encode(key)}=${encode(value)}`)
    .join('&');

  return query.length ? `${path}?${query}` : path;
}

export function parseParams(url: string) {
  const [, query] = url.split('?');

  if (!query) {
    return {};
  }

  return Object.fromEntries(
    query.split('&').map(param => {
      const [key, value] = param.split('=');
      return [decode(key), decode(value)];
    }),
  );
}
