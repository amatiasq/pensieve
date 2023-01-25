import { CLIENT_ID_DEV, CLIENT_ID_PROD } from '../config.json';

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
export default async request => {
  const { searchParams } = new URL(request.url);
  const redirect_uri = searchParams.get('redirect_uri');
  const isDev = redirect_uri.startsWith('http://localhost');

  const url = 'https://github.com/login/oauth/access_token';
  const params = new URLSearchParams({
    client_id: isDev ? CLIENT_ID_DEV : CLIENT_ID_PROD,
    client_secret: isDev ? CLIENT_SECRET_DEV : CLIENT_SECRET_PROD,
    redirect_uri,
    state: searchParams.get('state'),
    code: searchParams.get('code'),
  });

  return fetch(`${url}?${params}`);
};
