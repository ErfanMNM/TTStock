/**
 * Cloudflare Worker — TTStock
 *
 * Serve SPA + API proxy cho ERPNext trong 1 Worker duy nhất.
 *
 * Deploy:
 *   npm run build && wrangler deploy
 *
 * Secrets:
 *   wrangler secret put SESSION_COOKIE
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // === API Proxy ===
    if (url.pathname.startsWith('/api/')) {
      return handleApiProxy(request, env);
    }

    // === SPA Fallback ===
    let response = await env.ASSETS.fetch(request);

    // Nếu 404 và là đường dẫn SPA (không phải file tĩnh) → fallback về index.html
    if (response.status === 404 && !url.pathname.includes('.')) {
      const indexUrl = new URL('/index.html', url.origin);
      response = await env.ASSETS.fetch(new Request(indexUrl.toString(), request));
    }

    return response;
  },
};

async function handleApiProxy(request, env) {
  const url = new URL(request.url);
  const erpTarget = env.ERP_TARGET || 'https://erp.mte.vn';

  const targetPath = url.pathname.replace('/api/', '');
  const targetUrl = `${erpTarget}/api/${targetPath}${url.search}`;

  const headers = {
    'Content-Type': request.headers.get('Content-Type') || 'application/json',
    'Accept': request.headers.get('Accept') || 'application/json',
    'X-Forwarded-Host': url.host,
  };

  if (env.SESSION_COOKIE) {
    headers['Cookie'] = env.SESSION_COOKIE;
  }

  try {
    const proxyReq = new Request(targetUrl, {
      method: request.method,
      headers,
      body: ['POST', 'PUT', 'PATCH'].includes(request.method)
        ? request.body
        : undefined,
    });

    const response = await fetch(proxyReq);

    // Handle redirect — rewrite location
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

    // Binary response (images, PDFs)
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

    // JSON response
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
      message: err instanceof Error ? err.message : 'Unknown error',
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
