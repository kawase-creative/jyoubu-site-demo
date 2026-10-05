const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

function validInstagramUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && ['instagram.com', 'www.instagram.com'].includes(url.hostname)
      && /^\/(p|reel|tv|stories)\//.test(url.pathname);
  } catch {
    return false;
  }
}

async function authorized(request, env, ctx) {
  if (ctx.access?.getIdentity) {
    const identity = await ctx.access.getIdentity();
    return Boolean(identity?.email);
  }
  if (env.DEV_AUTH_BYPASS === 'true' && new URL(request.url).hostname === 'localhost') return true;
  return false;
}

function assetUrl(key) {
  return key ? `/media/${encodeURIComponent(key)}` : '';
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/media/') && request.method === 'GET') {
      const key = decodeURIComponent(url.pathname.slice('/media/'.length));
      if (!key || key.split('/').some((part) => part === '..' || part === '.')) return new Response('Not found', { status: 404 });
      const object = await env.MEDIA.get(key);
      if (!object) return new Response('Not found', { status: 404 });
      const headers = new Headers({
        'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        'Cache-Control': 'private, max-age=600',
        'X-Content-Type-Options': 'nosniff'
      });
      object.writeHttpMetadata(headers);
      headers.set('Cache-Control', 'private, max-age=600');
      return new Response(object.body, { headers });
    }
    if (url.pathname.startsWith('/api/admin/')) {
      if (!(await authorized(request, env, ctx))) return json({ error: 'Please sign in with your authorized email.' }, 401);
      if (!['GET', 'HEAD'].includes(request.method) && request.headers.get('Origin') !== url.origin) {
        return json({ error: 'Request origin is not allowed.' }, 403);
      }
      if (request.method === 'GET' && url.pathname === '/api/admin/content') {
        const [works, instagram] = await Promise.all([
          env.DB.prepare(`SELECT id, title, description, image_key AS imageKey, image_url AS imageUrl, image_alt AS imageAlt,
            instagram_url AS instagramUrl, sort_order AS sortOrder
            FROM works ORDER BY sort_order DESC, created_at DESC`).all(),
          env.DB.prepare(`SELECT id, url, caption, sort_order AS sortOrder
            FROM instagram_posts ORDER BY created_at DESC, sort_order DESC`).all()
        ]);
        return json({ works: works.results, instagram: instagram.results });
      }

      if (request.method === 'POST' && url.pathname === '/api/admin/media') {
        const form = await request.formData();
        const file = form.get('image');
        if (!(file instanceof File) || !ALLOWED_IMAGE_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES) {
          return json({ error: 'JPEG・PNG・WebPの画像（10MB以下）を選んでください。' }, 400);
        }
        const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.slice('image/'.length);
        const key = `work-images/${crypto.randomUUID()}.${extension}`;
        await env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
        return json({ imageKey: key, imageUrl: assetUrl(key) }, 201);
      }

      if (request.method === 'POST' && url.pathname === '/api/admin/works') {
        const body = await request.json().catch(() => null);
        if (!body || !String(body.title || '').trim() || !(String(body.imageKey || '').trim() || String(body.imageUrl || '').trim())) {
          return json({ error: 'タイトルと写真を入力してください。' }, 400);
        }
        const instagramUrl = String(body.instagramUrl || '').trim();
        if (instagramUrl && !validInstagramUrl(instagramUrl)) return json({ error: 'Instagramの投稿URLを確認してください。' }, 400);
        const id = crypto.randomUUID();
        const sortOrder = await env.DB.prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM works').first();
        await env.DB.prepare(`INSERT INTO works (id, title, description, image_key, image_url, image_alt, instagram_url, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(id, String(body.title).trim(), String(body.description || '').trim(), String(body.imageKey || ''),
            String(body.imageKey ? '' : body.imageUrl || ''), String(body.imageAlt || body.title).trim(), instagramUrl, sortOrder.next).run();
        return json({ id }, 201);
      }

      const workMatch = url.pathname.match(/^\/api\/admin\/works\/([\w-]+)$/);
      if (workMatch && request.method === 'PUT') {
        const body = await request.json().catch(() => null);
        if (!body || !String(body.title || '').trim() || !(String(body.imageKey || '').trim() || String(body.imageUrl || '').trim())) {
          return json({ error: 'タイトルと写真を入力してください。' }, 400);
        }
        const instagramUrl = String(body.instagramUrl || '').trim();
        if (instagramUrl && !validInstagramUrl(instagramUrl)) return json({ error: 'Instagramの投稿URLを確認してください。' }, 400);
        const result = await env.DB.prepare(`UPDATE works SET title = ?, description = ?, image_key = ?, image_url = ?, image_alt = ?,
          instagram_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
          .bind(String(body.title).trim(), String(body.description || '').trim(), String(body.imageKey || ''),
            String(body.imageKey ? '' : body.imageUrl || ''), String(body.imageAlt || body.title).trim(), instagramUrl, workMatch[1]).run();
        return result.meta.changes ? json({ ok: true }) : json({ error: '施工事例が見つかりません。' }, 404);
      }

      if (workMatch && request.method === 'DELETE') {
        await env.DB.prepare('DELETE FROM works WHERE id = ?').bind(workMatch[1]).run();
        return json({ ok: true });
      }

      if (request.method === 'POST' && url.pathname === '/api/admin/instagram') {
        const body = await request.json().catch(() => null);
        const postUrl = String(body?.url || '').trim();
        if (!validInstagramUrl(postUrl)) return json({ error: '公開投稿・リールのInstagram URLを入力してください。' }, 400);
        const id = crypto.randomUUID();
        const sortOrder = await env.DB.prepare('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM instagram_posts').first();
        await env.DB.prepare(`INSERT INTO instagram_posts (id, url, caption, sort_order) VALUES (?, ?, ?, ?)`)
          .bind(id, postUrl, String(body.caption || '').trim(), sortOrder.next).run();
        return json({ id }, 201);
      }

      const instagramMatch = url.pathname.match(/^\/api\/admin\/instagram\/([\w-]+)$/);
      if (instagramMatch && request.method === 'DELETE') {
        await env.DB.prepare('DELETE FROM instagram_posts WHERE id = ?').bind(instagramMatch[1]).run();
        return json({ ok: true });
      }

      return json({ error: 'Not found' }, 404);
    }

    if (request.method === 'GET') return env.ASSETS.fetch(request);
    return new Response('Not found', { status: 404 });
  }
};
