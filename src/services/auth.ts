import { getSetting, setSetting } from './settings';

export function getCredentials() {
  let user: string | null = getSetting('username');
  let token: string | null = getSetting('accessToken');

  if (!user) {
    user = prompt(`What's your Github's username?`);

    if (!user) {
      throw new Error('Username not provided');
    }

    setSetting('username', user);
  }

  if (!token) {
    console.log('https://github.com/settings/tokens');
    token = prompt(`Please provide a Github Access Token with "gist" accesss`);

    if (!token) {
      throw new Error('Username not provided');
    }

    setSetting('accessToken', token);
  }

  if (!user || !token) {
    throw new Error('Invalid credentials');
  }

  return { user, token };
}
