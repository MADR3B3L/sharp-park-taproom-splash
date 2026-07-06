import { isAuthorized, json, unauthorized, validateContent, writeContent } from '../_lib/data.js';

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost(context) {
  if (!isAuthorized(context.request, context.env)) return unauthorized();
  const body = await context.request.json();
  if (!validateContent(body.content)) {
    return json({ error: 'Content payload was missing required site fields.' }, { status: 400 });
  }
  const meta = await writeContent(context.env.SHARP_PARK_DATA, body.content);
  return json({ ok: true, meta });
}
