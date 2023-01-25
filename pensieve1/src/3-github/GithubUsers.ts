import { GithubToken } from './GithubAuth';
import { GithubRestApi } from './GithubRestApi';
import { GHApiUser } from './models/GHApiUser';

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
