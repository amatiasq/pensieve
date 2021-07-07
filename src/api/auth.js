const axios = require('axios');
const pipeAxiosToExpress = require('./_proxyAxiosToExpress');

const { CLIENT_ID_PROD, CLIENT_ID_DEV } = require('../config.json');
const { CLIENT_SECRET_PROD, CLIENT_SECRET_DEV } = process.env;

module.exports = async (req, res) => {
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
