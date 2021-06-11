import { DELETE, GET, PATCH, POST, PUT, RequestBody } from '../1-core/http';
import { GithubToken } from './GithubAuth';

export const GH_API = 'https://api.github.com';

export abstract class GithubApi {
  constructor(public token: GithubToken) {}

  protected GET<T>(path: string) {
    return GET<T>(url(path), this.withAuth());
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

  private withAuth() {
    const headers = {
      Authorization: `token ${this.token}`,
      Accept: 'application/vnd.github.v3+json',
    };
    return { headers };
  }
}

function url(path: string) {
  const result = `${GH_API}${path}`;
  const booster = `p=${Date.now()}`;
  return result.includes('?') ? `${result}&${booster}` : `${result}?${booster}`;
}
