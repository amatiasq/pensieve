import { ClientStorage } from '@amatiasq/client-storage';

import { POST } from '../1-core/http';
import { parseParams, withParams } from '../1-core/url';

const AUTH_ROOT = 'https://github.com/login/oauth';

export type GithubToken = '[string GithubToken]';

export class GithubAuth {
  private readonly requestState = new ClientStorage<string>('notes.gh-state', {
    default: 'init',
    version: 1,
  });
  private readonly auth = new ClientStorage<GithubToken | null>(
    'notes.gh-token',
    { default: null, version: 1 },
  );

  private readonly clientId: string;
  private readonly scope: string;
  private readonly redirectUri: string;
  private readonly endpoint: string;

  get token() {
    return this.auth.cache;
  }

  get headers() {
    return {
      Authorization: `token ${this.token}`,
      Accept: 'application/vnd.github.v3+json',
    };
  }

  get state() {
    return this.requestState.cache;
  }

  constructor(params: {
    clientId: string;
    scope: string;
    redirectUri: string;
    endpoint: string;
  }) {
    this.clientId = params.clientId;
    this.scope = params.scope;
    this.redirectUri = params.redirectUri;
    this.endpoint = params.endpoint;
  }

  requestGithubAuthorization() {
    const state = Math.random().toString().substr(2);

    const url = withParams(`${AUTH_ROOT}/authorize`, {
      client_id: this.clientId,
      scope: this.scope,
      redirect_uri: this.redirectUri,
      state,
    });

    this.requestState.set(state);
    location.replace(url);
  }

  async processGithubAuthCode(code: string, state: string) {
    if (state && state !== this.state) {
      throw new Error(
        `Request state do not match: "${state}" - "${this.state}`,
      );
    }

    if (code) {
      this.requestState.reset();
      history.pushState({}, '', this.redirectUri);
    }

    const x = await this.requestAccessToken(code, state);
    const { access_token } = parseParams(`/?${x}`) as {
      access_token: GithubToken;
    };

    this.auth.set(access_token);
    return access_token;
  }

  private requestAccessToken(code: string, state: string) {
    const url = withParams(this.endpoint, {
      redirect_uri: this.redirectUri,
      state,
      code,
    });

    return POST<{ result: string }>(url);
  }
}
