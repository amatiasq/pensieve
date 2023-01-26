import type {
  AuthCallback,
  AuthFailureCallback,
  AuthSuccessCallback,
  CallbackFsClient,
  HttpClient,
  MessageCallback,
  ProgressCallback,
  PromiseFsClient,
} from 'isomorphic-git';
import { gitFs } from './git.fs';

const git = (window as any).git as Git;
const http = (window as any).http as HttpClient;

const defaultProps = {
  fs: gitFs,
  http,
  corsProxy: 'https://cors.isomorphic-git.org',
};

type OmitDefaults<T extends (...args: any) => any> = Omit<
  Parameters<T>[0],
  keyof typeof defaultProps
>;

export function clone(options: OmitDefaults<Git['clone']>) {
  console.log(defaultProps, options);
  return git.clone({ ...defaultProps, ...options });
}

type Git = {
  clone(opts: {
    fs: CallbackFsClient | PromiseFsClient;
    http: HttpClient;
    onProgress?: ProgressCallback;
    onMessage?: MessageCallback;
    onAuth?: AuthCallback;
    onAuthFailure?: AuthFailureCallback;
    onAuthSuccess?: AuthSuccessCallback;
    dir: string;
    gitdir?: string;
    url: string;
    corsProxy?: string;
    ref?: string;
    singleBranch?: boolean;
    noCheckout?: boolean;
    noTags?: boolean;
    remote?: string;
    depth?: number;
    since?: Date;
    exclude?: string[];
    relative?: boolean;
    headers?: { [x: string]: string };
    cache?: any;
  }): Promise<void>;
};
