/**
 * Cloudflare Pages Function - API Gateway for TTStock
 *
 * Intercepts all /api/* requests and proxies them to ERPNext (erp.mte.vn).
 * Handles CORS, session cookies, and error responses.
 *
 * Setup:
 *   1. npm run build
 *   2. npx wrangler pages deploy dist
 *   3. Set SESSION_COOKIE secret: wrangler secret put SESSION_COOKIE
 *
 * Or set SESSION_COOKIE in wrangler.toml vars if using R2 binding.
 */

interface Env {
  SESSION_COOKIE?: string;
  ERP_TARGET?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const erpTarget = context.env.ERP_TARGET || 'https://erp.mte.vn';

  // Only proxy /api/* requests
  if (!url.pathname.startsWith('/api/')) {
    return context.next();
  }

  const targetPath = url.pathname.replace('/api/', '');
  const targetUrl = `${erpTarget}/api/${targetPath}${url.search}`;

  const headers: Record<string, string> = {
    'Content-Type': context.request.headers.get('Content-Type') || 'application/json',
    'Accept': context.request.headers.get('Accept') || 'application/json',
    'X-Forwarded-Host': url.host,
  };

  // Forward session cookie if available
  if (context.env.SESSION_COOKIE) {
    headers['Cookie'] = context.env.SESSION_COOKIE;
  }

  try {
    const proxyReq = new Request(targetUrl, {
      method: context.request.method,
      headers,
      body: ['POST', 'PUT', 'PATCH'].includes(context.request.method)
        ? context.request.body
        : undefined,
    } as RequestInit);

    const response = await fetch(proxyReq);

    // Handle redirect
    if (response.status === 302 || response.status === 303) {
      const location = response.headers.get('Location') || '';
      const newLocation = location.replace(erpTarget, '');
      const newHeaders = new Headers();
      response.headers.forEach((v, k) => {
        if (k.toLowerCase() !== 'location') {
          newHeaders.set(k, v);
        }
      });
      newHeaders.set('Location', newLocation);
      return new Response(null, { status: response.status, headers: newHeaders });
    }

    // Forward response with CORS
    const contentType = response.headers.get('Content-Type') || '';
    const isBinary = contentType.startsWith('image/') ||
      contentType.includes('octet-stream') ||
      contentType.includes('application/pdf');

    if (isBinary) {
      return new Response(response.body, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({
      exception: 'Proxy error',
      message: (err as Error).message,
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
