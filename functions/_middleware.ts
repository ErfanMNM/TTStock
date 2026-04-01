/**
 * Cloudflare Pages Middleware - Global CORS handler
 *
 * Adds CORS headers to all responses so the frontend can call /api/*.
 */

export const onRequest: PagesFunction = async (context) => {
  const response = await context.next();
  const newHeaders = new Headers(response.headers);

  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  newHeaders.set('Access-Control-Allow-Headers', '*');
  newHeaders.set('Access-Control-Max-Age', '86400');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};
