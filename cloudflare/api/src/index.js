const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  'Vary': 'Origin'
});

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowedOrigin = origin === env.ALLOWED_ORIGIN ? origin : '';
    const headers = allowedOrigin ? corsHeaders(allowedOrigin) : {};

    if (request.method === 'OPTIONS') {
      if (!allowedOrigin) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers });
    }

    if (url.pathname.startsWith('/api/') && origin && !allowedOrigin) {
      return json({ error: 'Origin not allowed.' }, 403);
    }

    if (url.pathname === '/api/content' && request.method === 'GET') {
      const [works, instagram] = await Promise.all([
        env.DB.prepare(`SELECT id, title, description, image_key AS imageKey, image_url AS imageUrl, image_alt AS imageAlt,
          instagram_url AS instagramUrl, sort_order AS sortOrder
          FROM works WHERE is_published = 1 ORDER BY sort_order DESC, created_at DESC`).all(),
        env.DB.prepare(`SELECT id, url, caption, sort_order AS sortOrder
          FROM instagram_posts WHERE is_published = 1 ORDER BY created_at DESC, sort_order DESC`).all()
      ]);
      return json({ works: works.results, instagram: instagram.results }, 200, headers);
    }

    if (url.pathname.startsWith('/media/')) {
      const key = decodeURIComponent(url.pathname.slice('/media/'.length));
      if (!key || key.split('/').some((part) => part === '..' || part === '.')) return new Response('Not found', { status: 404 });
      const object = await env.MEDIA.get(key);
      if (!object) return new Response('Not found', { status: 404 });
      const responseHeaders = new Headers({
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'X-Content-Type-Options': 'nosniff'
      });
      object.writeHttpMetadata(responseHeaders);
      responseHeaders.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
      return new Response(object.body, { headers: responseHeaders });
    }

    if (url.pathname === '/health') return json({ ok: true });
    return new Response('Not found', { status: 404 });
  }
};
