import { clone as gitClone } from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import { getFrontendFs } from './fs';

const fs = getFrontendFs();

const defaultProps = {
  fs,
  http,
  corsProxy: 'https://cors.isomorphic-git.org',
};

type OmitDefaults<T extends (...args: any) => any> = Omit<
  Parameters<T>[0],
  keyof typeof defaultProps
>;

export function clone(options: OmitDefaults<typeof gitClone>) {
  return gitClone({ ...defaultProps, ...options });
}
