import { GithubApi } from './GithubApi';
import { GHApiUser } from './models/GHApiUser';

export class GithubUsers extends GithubApi {
  async fetchCurrentUsername() {
    const response = await this.GET<GHApiUser>(`/user`);
    return response.login;
  }
}
