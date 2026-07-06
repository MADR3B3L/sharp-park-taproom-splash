// Splash cover + living bubble. Depends on content.js already having run
// (uses window.SITE_CONTENT and the seededShuffle() it defines) so the bubble
// shows a real featured vendor instead of a hardcoded placeholder.
//
// "Who's here right now": there's no live calendar feed wired up yet, so this
// reuses the same date-seeded vendor spotlight that already powers the
// homepage chips -- same vendor, same day, consistent story across the site.
// Once a real calendar is connected, swap this for whichever vendor is
// actually scheduled right now instead of the spotlight pick.
function pickFeaturedVendor() {
  const vendors = window.SITE_CONTENT && window.SITE_CONTENT.vendors;
  if (!vendors || !Array.isArray(vendors.partners)) return null;
  if (vendors.bubbleCurrentVendor && vendors.bubbleCurrentVendor.name) {
    return vendors.bubbleCurrentVendor;
  }
  const active = vendors.partners.filter((v) => v.active !== 'no' && v.name);
  if (!active.length) return null;
  return seededShuffle(active, new Date().toDateString())[0];
}

function initSplash() {
  const cover = document.getElementById('cover');
  const bubble = document.getElementById('sp-bubble');
  const card = document.getElementById('sp-card');
  const closeX = document.getElementById('sp-close');
  if (!cover || !bubble || !card) return;

  const vendors = window.SITE_CONTENT && window.SITE_CONTENT.vendors;
  const bubbleEnabled = vendors ? vendors.bubbleEnabled !== false : true;
  const vendor = pickFeaturedVendor();
  const bubbleName = document.getElementById('sp-bubble-name');
  const bubbleNote = document.getElementById('sp-bubble-note');
  const cardName = document.getElementById('sp-card-name');
  const cardNote = document.getElementById('sp-card-note');
  if (bubbleEnabled && vendor) {
    const label = vendor.cuisine ? `${vendor.name}` : vendor.name;
    if (bubbleName) bubbleName.textContent = label;
    if (bubbleNote) bubbleNote.textContent = (vendors && vendors.bubbleNote) || 'featured today';
    if (cardName) cardName.textContent = vendor.name;
    if (cardNote) cardNote.textContent = vendor.cuisine
      ? `${vendor.cuisine} — one of today's featured pop-ups. Once the live calendar's connected, this'll show exactly who's on site right now.`
      : `One of today's featured pop-ups. Once the live calendar's connected, this'll show exactly who's on site right now.`;
  } else {
    bubble.style.display = 'none';
  }

  // add ?slow=1 to the URL to hold the splash longer while eyeballing it
  const HOLD_MS = new URLSearchParams(location.search).get('slow') ? 8000 : 2000;

  let released = false;
  setTimeout(() => {
      cover.classList.add('disperse');
      setTimeout(() => {
        cover.style.display = 'none';
        if (!bubbleEnabled || !vendor) return;
        x = (window.innerWidth - bubble.offsetWidth) / 2;
        y = 130;
        bubble.style.left = x + 'px';
      bubble.style.top = y + 'px';
      bubble.classList.add('in');
      released = true;
    }, 1150);
  }, HOLD_MS);

  // ── wander + shy-but-catchable ──────────────────────────────────────
  let x = 40, y = window.innerHeight * 0.3;
  let vx = 0.4, vy = 0.24, t = 0;
  let wandering = true;
  let mouseX = -999, mouseY = -999;
  const CATCH_RADIUS = 95, SURRENDER_MS = 600;
  let nearMs = 0, lastT = performance.now(), tired = false;

  document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

  function step(now) {
    const dt = Math.min(50, now - lastT); lastT = now;
    if (released && wandering) {
      const r = bubble.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = cx - mouseX, dy = cy - mouseY, dist = Math.hypot(dx, dy);
      const inRange = dist < CATCH_RADIUS;
      if (inRange) nearMs += dt; else nearMs = Math.max(0, nearMs - dt * 2);
      const surrendered = nearMs >= SURRENDER_MS;
      if (surrendered !== tired) { tired = surrendered; bubble.classList.toggle('tired', tired); }

      t += 0.03;
      x += vx; y += vy + Math.sin(t) * 0.35;
      if (inRange && !surrendered && dist > 0) {
        const s = 1.6 * (1 - nearMs / SURRENDER_MS);
        x += (dx / dist) * s; y += (dy / dist) * s;
      }
      const w = bubble.offsetWidth, h = bubble.offsetHeight;
      const maxX = window.innerWidth - w - 16, maxY = window.innerHeight - h - 16;
      if (x <= 12 || x >= maxX) { vx *= -1; x = Math.max(12, Math.min(maxX, x)); }
      if (y <= 12 || y >= maxY) { vy *= -1; y = Math.max(12, Math.min(maxY, y)); }
      bubble.style.left = x + 'px'; bubble.style.top = y + 'px';
    }
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);

  bubble.addEventListener('click', () => {
    if (!released) return;
    wandering = false;
    const r = bubble.getBoundingClientRect();
    let cy = r.top - 210; if (cy < 20) cy = r.bottom + 12;
    card.style.left = Math.min(r.left, window.innerWidth - 280) + 'px';
    card.style.top = cy + 'px';
    card.classList.add('show'); bubble.style.opacity = '.25';
  });
  function dismiss() { card.classList.remove('show'); card.style.transform = 'scale(0)'; bubble.style.opacity = '1'; wandering = true; }
  closeX.addEventListener('click', dismiss);
  card.addEventListener('click', (e) => { if (e.target === card) dismiss(); });
}
