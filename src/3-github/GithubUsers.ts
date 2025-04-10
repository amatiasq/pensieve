import { GithubToken } from './GithubAuth.ts';
import { GithubRestApi } from './GithubRestApi.ts';
import { GHApiUser } from './models/GHApiUser.ts';

export class GithubUsers {
  private readonly rest: GithubRestApi;

  constructor(token: GithubToken) {
    this.rest = new GithubRestApi(token);
  }

  async fetchCurrentUsername() {
    const response = await this.rest.GET<GHApiUser>(`/user`);
    return response.login;
  }
}
