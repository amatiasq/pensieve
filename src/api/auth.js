const axios = require('axios');
const config = import('../config.mjs');
const pipeAxiosToExpress = require('./_proxyAxiosToExpress');

module.exports = async (req, res) => {
  const {
    CLIENT_ID_PROD,
    CLIENT_SECRET_PROD,
    CLIENT_ID_DEV,
    CLIENT_SECRET_DEV,
  } = await config;

  const { code, redirect_uri, state } = req.query;
  const isDev = redirect_uri.startsWith('http://localhost');

  const params = {
    client_id: isDev ? CLIENT_ID_DEV : CLIENT_ID_PROD,
    client_secret: isDev ? CLIENT_SECRET_DEV : CLIENT_SECRET_PROD,
    redirect_uri,
    state,
    code,
  };

  console.log(params);

  const response = axios.get('https://github.com/login/oauth/access_token', {
    params,
  });

  return pipeAxiosToExpress(response, req, res);
};
