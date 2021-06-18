import { DELETE, GET, PATCH, POST, PUT, RequestBody } from '../1-core/http';
import { GH_API } from '../config.mjs';
import { GithubToken } from './GithubAuth';

export enum MediaType {
  Json = 'application/vnd.github.v3+json',
  Raw = 'application/vnd.github.v3.raw',
  Html = 'application/vnd.github.v3.html',
}

interface GHRequestOptions {
  mediaType?: MediaType;
}

export abstract class GithubApi {
  constructor(public token: GithubToken) {}

  protected GET<T>(path: string, options?: GHRequestOptions) {
    return GET<T>(url(path), this.withAuth(options));
  }

  protected DELETE<T>(path: string) {
    return DELETE<T>(url(path), this.withAuth());
  }

  protected PUT<T>(path: string, body: RequestBody) {
    return PUT<T>(url(path), body, this.withAuth());
  }

  protected POST<T>(path: string, body: RequestBody) {
    return POST<T>(url(path), body, this.withAuth());
  }

  protected PATCH<T>(path: string, body: RequestBody) {
    return PATCH<T>(url(path), body, this.withAuth());
  }

  private withAuth({ mediaType = MediaType.Json }: GHRequestOptions = {}) {
    return {
      headers: {
        Authorization: `token ${this.token}`,
        Accept: mediaType,
      },
    };
  }
}

function url(path: string) {
  const result = `${GH_API}${path}`;
  const booster = `p=${Date.now()}`;
  return result.includes('?') ? `${result}&${booster}` : `${result}?${booster}`;
}
