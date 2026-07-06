import { isAuthorized, json, unauthorized, validateTapsCsv, writeTaps } from '../_lib/data.js';

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestPost(context) {
  if (!isAuthorized(context.request, context.env)) return unauthorized();
  const body = await context.request.json();
  if (!validateTapsCsv(body.tapsCsv)) {
    return json({ error: 'Tap payload must be the raw CSV text.' }, { status: 400 });
  }
  const meta = await writeTaps(context.env.SHARP_PARK_DATA, body.tapsCsv);
  return json({ ok: true, meta });
}
