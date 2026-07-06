// Applies assets/content-data.js (window.SITE_CONTENT) to [data-edit] elements
// and the calendar embed. Synchronous, no fetch -- works from a double-clicked
// file just as well as from a real web server. If SITE_CONTENT is missing or
// malformed for any reason, every element just keeps its HTML default.

function resolvePath(obj, path) {
  return path.split('.').reduce((node, key) => (node == null ? undefined : node[key]), obj);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function applyValue(el, value) {
  if (value == null) return;
  const attr = el.getAttribute('data-edit-attr');
  if (attr) {
    el.setAttribute(attr, value);
    return;
  }
  if (Array.isArray(value)) {
    el.innerHTML = value.map(escapeHtml).join('<br>');
  } else {
    el.textContent = value;
  }
}

const COLOR_VARS = {
  oceanDeep: '--ocean-deep',
  yellow: '--yellow',
  wood: '--wood',
};

function applyColors(colors) {
  if (!colors) return;
  const root = document.documentElement.style;
  for (const [key, cssVar] of Object.entries(COLOR_VARS)) {
    if (colors[key]) root.setProperty(cssVar, colors[key]);
  }
}

// Deterministic shuffle seeded by a string (the date) -- same order all day
// for every visitor, different order tomorrow. No server needed for that.
function seededShuffle(arr, seedStr) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  function rand() {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function applyVendorSpotlight(vendors) {
  const slot = document.getElementById('vendor-spotlight');
  if (!slot || !vendors || !Array.isArray(vendors.partners)) return;
  const active = vendors.partners.filter((v) => v.active !== 'no' && v.name);
  if (!active.length) return;
  const count = Math.min(vendors.spotlightCount || 3, active.length);
  const picked = seededShuffle(active, new Date().toDateString()).slice(0, count);
  slot.innerHTML = picked.map((v) => {
    const avatar = v.photoUrl
      ? `<img class="vendor-chip-photo" src="${escapeHtml(v.photoUrl)}" alt="">`
      : `<span class="vendor-chip-initial">${escapeHtml((v.name || '?').charAt(0))}</span>`;
    const cuisine = v.cuisine ? `<span class="vendor-chip-cuisine">· ${escapeHtml(v.cuisine)}</span>` : '';
    return `<span class="vendor-chip">${avatar}${escapeHtml(v.name)}${cuisine}</span>`;
  }).join('');
}

function applyCalendar(calendar) {
  const slot = document.getElementById('calendar-slot');
  if (!slot || !calendar || !calendar.embedUrl) return; // no link yet -> keep the placeholder
  slot.innerHTML = `<iframe src="${escapeHtml(calendar.embedUrl)}" style="width:100%;height:400px;border:0;" loading="lazy"></iframe>`;
}

function applySocialLinks(social) {
  document.querySelectorAll('[data-social-platform]').forEach((el) => {
    const key = el.getAttribute('data-social-platform');
    const value = social && social[key];
    if (value) {
      el.classList.remove('is-hidden');
      el.setAttribute('href', value);
    } else {
      el.classList.add('is-hidden');
    }
  });
}

function applyContent() {
  const content = window.SITE_CONTENT;
  if (!content) return; // content-data.js didn't load -- HTML defaults stand as-is

  document.querySelectorAll('[data-edit]').forEach((el) => {
    try {
      applyValue(el, resolvePath(content, el.getAttribute('data-edit')));
    } catch (e) {
      // leave this one element's HTML default in place and keep going
    }
  });

  try { applyColors(content.colors); } catch (e) {}
  try { applyCalendar(content.calendar); } catch (e) {}
  try { applySocialLinks(content.social); } catch (e) {}
  try { applyVendorSpotlight(content.vendors); } catch (e) {}
}
