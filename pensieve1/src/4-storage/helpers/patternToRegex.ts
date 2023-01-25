export function patternToRegex(pattern: string) {
  const start = pattern.startsWith('*') ? '' : '^';
  const end = pattern.endsWith('*') ? '' : '$';
  const clean = pattern.replace(/^\*|\*$/g, '');
  return new RegExp(`${start}${clean}${end}`);
}
