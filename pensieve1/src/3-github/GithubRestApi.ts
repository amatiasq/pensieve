import { DELETE, GET, PATCH, POST, PUT, RequestBody } from '../1-core/http';
import { ghAuthHeaders, ghUrl } from './gh-utils';
import { GithubToken } from './GithubAuth';

export enum MediaType {
  Json = 'application/vnd.github.v3+json',
  Raw = 'application/vnd.github.v3.raw',
  Html = 'application/vnd.github.v3.html',
}

interface GHRequestOptions {
  mediaType?: MediaType;
}

export class GithubRestApi {
  constructor(public token: GithubToken) {}

  GET<T>(path: string, options?: GHRequestOptions) {
    return GET<T>(ghUrl(path), this.withAuth(options));
  }

  DELETE<T>(path: string) {
    return DELETE<T>(ghUrl(path), this.withAuth());
  }

  PUT<T>(path: string, body: RequestBody) {
    return PUT<T>(ghUrl(path), body, this.withAuth());
  }

  POST<T>(path: string, body: RequestBody) {
    return POST<T>(ghUrl(path), body, this.withAuth());
  }

  PATCH<T>(path: string, body: RequestBody) {
    return PATCH<T>(ghUrl(path), body, this.withAuth());
  }

  private withAuth({ mediaType = MediaType.Json }: GHRequestOptions = {}) {
    return {
      headers: {
        ...ghAuthHeaders(this.token),
        Accept: mediaType,
      },
    };
  }
}
