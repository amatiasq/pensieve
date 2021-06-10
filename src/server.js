/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */

const http = require('http');
const https = require('https');

const encode = encodeURIComponent;
const decode = decodeURIComponent;

const { PORT, CLIENT_ID_PROD, CLIENT_SECRET_PROD, CLIENT_ID_DEV, CLIENT_SECRET_DEV } = process.env;

const server = http.createServer(async (req, res) => {
  const { code, redirect_uri, state } = parseParams(req.url);
  const isDev = redirect_uri.startsWith('http://localhost');

  const url = withParams(`https://github.com/login/oauth/access_token`, {
    client_id: isDev ? CLIENT_ID_DEV : CLIENT_ID_PROD,
    client_secret: isDev ? CLIENT_SECRET_DEV : CLIENT_SECRET_PROD,
    redirect_uri,
    state,
    code,
  });

  const result = await request(url);

  res.writeHead(200, {
    'Access-Control-Allow-Origin': req.headers.origin,
    'Access-Control-Allow-Methods': 'GET',
    'Content-Type': 'application/json',
  });

  console.log(`Login request from ${redirect_uri}`);
  res.end(JSON.stringify({ result }));
});

server.listen(PORT);
console.log(`Listening at ${PORT}`);

function request(url) {
  return new Promise((resolve, reject) => {
    let dataString = '';

    const req = https.get(url, function (res) {
      res.on('data', chunk => {
        dataString += chunk;
      });

      res.on('end', () => {
        resolve(dataString);
      });
    });

    req.on('error', e => {
      reject(e);
    });
  });
}

function withParams(path, params) {
  const query = Object.entries(params)
    .map(([key, value]) => `${encode(key)}=${encode(value)}`)
    .join('&');

  return query.length ? `${path}?${query}` : path;
}

function parseParams(url) {
  const [, query] = url.split('?');

  if (!query) {
    return {};
  }

  const result = {};

  query.split('&').map(param => {
    const [key, value] = param.split('=');
    return (result[decode(key)] = decode(value));
  });

  return result;
}
