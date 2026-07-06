import { seedContent } from './seed-content.js';
import { seedTapsCsv } from './seed-taps.js';

const CONTENT_KEY = 'sharp-park-content';
const TAPS_KEY = 'sharp-park-taps';
const META_KEY = 'sharp-park-meta';

export function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('access-control-allow-origin', '*');
  headers.set('access-control-allow-headers', 'content-type, x-admin-key');
  headers.set('access-control-allow-methods', 'GET, POST, OPTIONS');
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers
  });
}

export function unauthorized() {
  return json({ error: 'Owner access code rejected.' }, { status: 401 });
}

export async function readJson(kv, key, fallback) {
  const raw = await kv.get(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

export async function readText(kv, key, fallback) {
  const raw = await kv.get(key);
  return raw || fallback;
}

export async function readMeta(kv) {
  return readJson(kv, META_KEY, {
    contentUpdatedAt: null,
    tapsUpdatedAt: null
  });
}

export async function readSiteData(kv) {
  const [content, tapsCsv, meta] = await Promise.all([
    readJson(kv, CONTENT_KEY, seedContent),
    readText(kv, TAPS_KEY, seedTapsCsv),
    readMeta(kv)
  ]);
  return { content, tapsCsv, meta };
}

export function validateContent(content) {
  return !!(content && typeof content === 'object' && content.hero && content.vendors && Array.isArray(content.hours));
}

export function validateTapsCsv(tapsCsv) {
  return typeof tapsCsv === 'string' && tapsCsv.includes('tap,beer,brewery,style,abv,active');
}

export function isAuthorized(request, env) {
  const key = request.headers.get('x-admin-key');
  return !!key && !!env.ADMIN_KEY && key === env.ADMIN_KEY;
}

export async function writeContent(kv, content) {
  const meta = await readMeta(kv);
  meta.contentUpdatedAt = new Date().toISOString();
  await Promise.all([
    kv.put(CONTENT_KEY, JSON.stringify(content)),
    kv.put(META_KEY, JSON.stringify(meta))
  ]);
  return meta;
}

export async function writeTaps(kv, tapsCsv) {
  const meta = await readMeta(kv);
  meta.tapsUpdatedAt = new Date().toISOString();
  await Promise.all([
    kv.put(TAPS_KEY, tapsCsv),
    kv.put(META_KEY, JSON.stringify(meta))
  ]);
  return meta;
}
