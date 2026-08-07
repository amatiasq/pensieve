import { GithubToken } from './GithubAuth.ts';
import { GithubRestApi } from './GithubRestApi.ts';
import { GHApiUser } from './models/GHApiUser.ts';

export async function fetchCurrentUsername(token: GithubToken) {
  const { login } = await new GithubRestApi(token).GET<GHApiUser>('/user');
  return login;
}
