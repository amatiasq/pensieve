import { VALID_ORIGINS } from '../config.json';
import auth from './auth.js';
import commit from './commit.js';

const handlers = { auth, commit };

addEventListener('fetch', event =>
  event.respondWith(handleCorsRequest(event.request)),
);

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleCorsRequest(request) {
  const method = request.method;
  const { origin } = new URL(request.url);

  console.log({ origin });

  const result = isValidOrigin(origin)
    ? await handleRequest(request).catch(handleError)
    : new Response('Who the fck are you?', { status: 403 });

  const response =
    result instanceof Response
      ? new Response(result.body, result)
      : new Response(JSON.stringify(result), { status: 200 });

  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', method);
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {
  const { pathname } = new URL(request.url);
  const [, firstPart] = pathname.split('/');
  const handler = handlers[firstPart];

  console.log(
    `Request to ${pathname} - ${handler ? handler.name : 'No handler'}`,
  );

  if (!handler) {
    return new Response(`Unknown route ${pathname}`, { status: 404 });
  }

  return handler(request);
}

function isValidOrigin(origin) {
  return (
    origin === 'localhost' ||
    origin === 'https://pensieve-api.amatiasq.workers.dev' ||
    VALID_ORIGINS.includes(origin)
  );
}

function handleError(err) {
  return new Response(err.stack, { status: 500 });
}
