const env =
  // eslint-disable-next-line no-undef
  typeof process !== 'undefined' && 'env' in process ? process.env : {};

const API_ROOT = 'https://gist.amatiasq.com';

export const GH_SCOPE = 'repo gist';
export const GH_API = 'https://api.github.com';
export const AUTH_ENDPOINT = `${API_ROOT}/auth`;
export const AUTH_COMMIT = `${API_ROOT}/commit`;
export const APP_ROOT = 'https://gist.amatiasq.com/';

export const CLIENT_ID_DEV = '3e0c6862be8f7272c3d4';
export const CLIENT_SECRET_DEV = env.CLIENT_SECRET_DEV;
export const CLIENT_ID_PROD = '120875b87556e8c052e4';
export const CLIENT_SECRET_PROD = env.CLIENT_SECRET_PROD;
