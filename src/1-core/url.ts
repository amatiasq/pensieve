export function withParams(
  path: string,
  params: Record<string, string | number | boolean> = {},
) {
  const search = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ),
  );

  const query = search.toString();
  return query.length ? `${path}?${query}` : path;
}

export function parseParams(url: string) {
  const search = new URL(url, location.origin).searchParams;
  return Object.fromEntries(search.entries());
}
