import { json, readSiteData } from '../_lib/data.js';

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet(context) {
  const data = await readSiteData(context.env.SHARP_PARK_DATA);
  return json(data);
}
