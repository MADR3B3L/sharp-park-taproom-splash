// Single source of truth for the tap list — same feed powers the website
// AND the printable bar menu (menu.html), so Alex updates it once.
//
// Right now it reads the local copy in assets/taps-data.js, which works even
// when this site is just opened by double-clicking the file -- no server,
// no internet needed. To go live on a phone-editable Google Sheet instead:
// 1. Put this sheet on Google Sheets with the same columns as taps.csv
//    (tap, beer, brewery, style, abv, active).
// 2. File > Share > Publish to web > pick the tap sheet > CSV.
// 3. Paste that published CSV URL in as GOOGLE_SHEET_CSV_URL below.
// Alex then edits the Google Sheet from his phone; the site and the
// printable menu both update automatically, no code changes needed.
const GOOGLE_SHEET_CSV_URL = '';

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const cells = line.split(',').map(c => c.trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = cells[i] || ''; });
    return row;
  });
}

async function fetchTaps() {
  const text = GOOGLE_SHEET_CSV_URL
    ? await (await fetch(GOOGLE_SHEET_CSV_URL, { cache: 'no-store' })).text()
    : window.TAPS_CSV_LOCAL;
  const rows = parseCsv(text);
  return rows
    .filter(r => r.active && r.active.toLowerCase() === 'yes' && r.beer)
    .sort((a, b) => Number(a.tap) - Number(b.tap));
}

function tapLabel(t) {
  const bits = [t.beer];
  const sub = [t.brewery, t.style, t.abv ? `${t.abv}%` : ''].filter(Boolean).join(' · ');
  return { name: bits.join(''), sub };
}

async function renderTapGrid() {
  const grid = document.getElementById('tap-grid');
  if (!grid) return;
  try {
    const taps = await fetchTaps();
    if (!taps.length) {
      grid.innerHTML = '<p class="fine-print">No taps published yet.</p>';
      return;
    }
    grid.innerHTML = taps.map(t => {
      const { name, sub } = tapLabel(t);
      return `<div class="tap-card">
        <span class="tap-number">${t.tap}</span>
        <div>
          <p class="tap-name">${name}</p>
          ${sub ? `<p class="tap-sub">${sub}</p>` : ''}
        </div>
      </div>`;
    }).join('');
  } catch (e) {
    grid.innerHTML = '<p class="fine-print">Couldn\'t load the tap list right now.</p>';
  }
}

async function renderMenuList() {
  const list = document.getElementById('menu-tap-list');
  if (!list) return;
  try {
    const taps = await fetchTaps();
    list.innerHTML = taps.map(t => {
      const { name, sub } = tapLabel(t);
      return `<li>
        <span class="menu-tap-number">${t.tap}</span>
        <span class="menu-tap-info">
          <span class="menu-tap-name">${name}</span>
          ${sub ? `<span class="menu-tap-sub">${sub}</span>` : ''}
        </span>
      </li>`;
    }).join('');
    const stamp = document.getElementById('menu-updated');
    if (stamp) stamp.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  } catch (e) {
    list.innerHTML = '<li>Couldn\'t load the tap list right now.</li>';
  }
}
