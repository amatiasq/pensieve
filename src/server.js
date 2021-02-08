/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */

const http = require('http');
const https = require('https');

const encode = encodeURIComponent;
const decode = decodeURIComponent;

const server = http.createServer(async (req, res) => {
  const { code, redirect_uri, state } = parseParams(req.url);

  const url = withParams(`https://github.com/login/oauth/access_token`, {
    client_id: '120875b87556e8c052e4',
    client_secret: '0e3f256f00f01cd73aade385da59c4e36a9eca50',
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

  res.end(JSON.stringify({ result }));
});

server.listen(60175);

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
  const [_, query] = url.split('?');

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
