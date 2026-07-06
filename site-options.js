// Site Options -- a plain form over assets/content-data.js and
// assets/taps-data.js. No LLM, no server. Loads the current values (already
// on the page as window.SITE_CONTENT / window.TAPS_CSV_LOCAL -- no fetch, so
// this works from a double-clicked file), lets you edit them, and saves
// straight back to disk (or offers a download if your browser can't do that).

function resolvePath(obj, path) {
  return path.split('.').reduce((node, key) => (node == null ? undefined : node[key]), obj);
}

function setPath(obj, path, value) {
  const keys = path.split('.');
  let node = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (node[key] == null) node[key] = /^\d+$/.test(keys[i + 1]) ? [] : {};
    node = node[key];
  }
  node[keys[keys.length - 1]] = value;
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = cells[i] ?? ''; });
    return row;
  });
}

function toCsv(rows) {
  const headers = ['tap', 'beer', 'brewery', 'style', 'abv', 'active'];
  const lines = [headers.join(',')];
  rows.forEach((r) => lines.push(headers.map((h) => r[h] ?? '').join(',')));
  return lines.join('\n') + '\n';
}

function escapeForTemplateLiteral(str) {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

async function saveFile(suggestedName, text) {
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({ suggestedName });
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      return 'saved';
    } catch (e) {
      if (e.name === 'AbortError') return 'cancelled';
      return 'error';
    }
  }
  // Fallback for browsers without File System Access (Safari, Firefox):
  // trigger a download the owner drags into the assets folder themselves.
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName;
  a.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
}

function downloadBlob(filename, text) {
  const blob = new Blob([text], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

let content = {};
let beerRows = [];
let vendorRows = [];
const live = window.SharpParkLiveData;

function setStatus(el, message) {
  if (el) el.textContent = message;
}

function updateLiveModeStatus(message) {
  setStatus(document.getElementById('live-mode-status'), message);
}

function getOwnerAccessCode() {
  const input = document.getElementById('owner-access-code');
  return input ? input.value.trim() : '';
}

function setOwnerAccessCode(value) {
  const input = document.getElementById('owner-access-code');
  if (input) input.value = value || '';
}

function refreshLiveModeStatus() {
  if (!live || !live.canUseLiveApi()) {
    updateLiveModeStatus('Live publishing not configured yet. File-save fallback still works.');
    return;
  }
  if (live.getStoredAdminKey()) {
    updateLiveModeStatus(`Live publishing is connected to ${live.getApiBase()}. Save buttons will update the hosted site.`);
    return;
  }
  updateLiveModeStatus(`Live API found at ${live.getApiBase()}, but this browser still needs the owner access code.`);
}

function setSectionCollapsed(section, collapsed) {
  section.classList.toggle('is-collapsed', collapsed);
  const button = section.querySelector('.section-toggle');
  if (button) {
    button.textContent = collapsed ? 'Open section' : 'Collapse section';
    button.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  }
}

function setupCollapsibleSections() {
  const sections = Array.from(document.querySelectorAll('.opt-card[data-collapsible="true"]'));
  sections.forEach((section) => {
    const head = section.querySelector('.section-head');
    const kicker = head ? head.querySelector('.section-kicker') : null;
    const title = head ? head.querySelector('h2') : null;
    const note = head ? head.querySelector('.section-note') : null;
    if (!head || !kicker || !title) return;

    const main = document.createElement('div');
    main.className = 'section-head-main';

    const left = document.createElement('div');
    left.appendChild(kicker);
    left.appendChild(title);

    main.appendChild(left);
    if (note) {
      main.appendChild(note);
    }

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'section-toggle';
    toggle.addEventListener('click', () => {
      setSectionCollapsed(section, !section.classList.contains('is-collapsed'));
    });

    head.innerHTML = '';
    head.appendChild(main);
    head.appendChild(toggle);
  });

  sections.forEach((section, index) => {
    setSectionCollapsed(section, index > 0);
  });

  const expandAll = document.getElementById('expand-all-sections');
  if (expandAll) {
    expandAll.addEventListener('click', () => {
      sections.forEach((section) => setSectionCollapsed(section, false));
    });
  }

  const collapseAll = document.getElementById('collapse-all-sections');
  if (collapseAll) {
    collapseAll.addEventListener('click', () => {
      sections.forEach((section) => setSectionCollapsed(section, true));
    });
  }
}

function fillWordsForm() {
  document.querySelectorAll('#words-card [data-field], #colors-card [data-field], #calendar-card [data-field], #vendors-card [data-field]').forEach((el) => {
    const value = resolvePath(content, el.getAttribute('data-field'));
    if (el.type === 'checkbox') {
      el.checked = value == null ? false : !!value;
      return;
    }
    if (value == null) return;
    el.value = value;
  });
}

function readWordsForm() {
  document.querySelectorAll('#words-card [data-field], #colors-card [data-field], #calendar-card [data-field], #vendors-card [data-field]').forEach((el) => {
    setPath(content, el.getAttribute('data-field'), el.type === 'checkbox' ? el.checked : el.value);
  });
}

function renderBeerRows() {
  const container = document.getElementById('beer-rows');
  container.innerHTML = '';
  beerRows.forEach((row, i) => {
    const div = document.createElement('div');
    div.className = 'beer-row';
    div.innerHTML = `
      <input type="checkbox" ${row.active === 'yes' ? 'checked' : ''} data-i="${i}" data-k="active">
      <input type="text" value="${row.beer || ''}" data-i="${i}" data-k="beer">
      <input type="text" value="${row.brewery || ''}" data-i="${i}" data-k="brewery">
      <input type="text" value="${row.style || ''}" data-i="${i}" data-k="style">
      <input type="text" value="${row.abv || ''}" data-i="${i}" data-k="abv">
      <button class="remove-btn" data-remove="${i}" title="Remove this tap">&times;</button>
    `;
    container.appendChild(div);
  });

  container.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', () => {
      const i = Number(input.dataset.i);
      const k = input.dataset.k;
      beerRows[i][k] = input.type === 'checkbox' ? (input.checked ? 'yes' : 'no') : input.value;
    });
  });
  container.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.addEventListener('click', () => {
      beerRows.splice(Number(btn.dataset.remove), 1);
      renumberTaps();
      renderBeerRows();
    });
  });
}

function renumberTaps() {
  beerRows.forEach((row, i) => { row.tap = String(i + 1); });
}

function renderVendorRows() {
  const container = document.getElementById('vendor-rows');
  container.innerHTML = '';
  vendorRows.forEach((row, i) => {
    const div = document.createElement('div');
    div.className = 'beer-row vendor-row';
    div.innerHTML = `
      <input type="checkbox" ${row.active !== 'no' ? 'checked' : ''} data-i="${i}" data-k="active">
      <input type="text" value="${row.name || ''}" data-i="${i}" data-k="name">
      <input type="text" value="${row.cuisine || ''}" data-i="${i}" data-k="cuisine">
      <input type="text" value="${row.photoUrl || ''}" data-i="${i}" data-k="photoUrl" placeholder="optional">
      <button class="remove-btn" data-remove-vendor="${i}" title="Remove this vendor">&times;</button>
    `;
    container.appendChild(div);
  });

  container.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', () => {
      const i = Number(input.dataset.i);
      const k = input.dataset.k;
      vendorRows[i][k] = input.type === 'checkbox' ? (input.checked ? 'yes' : 'no') : input.value;
    });
  });
  container.querySelectorAll('[data-remove-vendor]').forEach((btn) => {
    btn.addEventListener('click', () => {
      vendorRows.splice(Number(btn.dataset.removeVendor), 1);
      renderVendorRows();
    });
  });
}

document.getElementById('add-vendor').addEventListener('click', () => {
  vendorRows.push({ name: '', cuisine: '', photoUrl: '', active: 'yes' });
  renderVendorRows();
});

document.getElementById('add-beer').addEventListener('click', () => {
  beerRows.push({ tap: String(beerRows.length + 1), beer: '', brewery: '', style: '', abv: '', active: 'yes' });
  renderBeerRows();
});

document.getElementById('save-access-code').addEventListener('click', () => {
  if (!live) return;
  const code = getOwnerAccessCode();
  live.setStoredAdminKey(code);
  setStatus(document.getElementById('access-code-status'), code ? 'Saved for this browser.' : 'Cleared.');
  refreshLiveModeStatus();
});

document.getElementById('clear-access-code').addEventListener('click', () => {
  if (!live) return;
  setOwnerAccessCode('');
  live.setStoredAdminKey('');
  setStatus(document.getElementById('access-code-status'), 'Cleared.');
  refreshLiveModeStatus();
});

document.querySelectorAll('[data-save]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const which = btn.getAttribute('data-save');
    const statusEl = btn.parentElement.querySelector('.save-status');
    statusEl.textContent = 'Saving…';
    try {
      const useLive = live && live.canUseLiveApi() && live.getStoredAdminKey();
      if (which === 'words') {
        readWordsForm();
        setPath(content, 'vendors.partners', vendorRows);
        if (useLive) {
          await live.saveLiveContent(content, live.getStoredAdminKey());
          statusEl.textContent = 'Published live ✓ Refresh the live site to confirm the change.';
          return;
        }
        const js = `window.SITE_CONTENT = ${JSON.stringify(content, null, 2)};\n`;
        const result = await saveFile('content-data.js', js);
        statusEl.textContent = {
          saved: 'Saved ✓ Refresh the live site tab to confirm the change.',
          downloaded: 'Downloaded ✓ Replace the old file with this one, then refresh the live site.',
          cancelled: '',
          error: 'Something went wrong — nothing was overwritten.',
        }[result];
        return;
      }

      renumberTaps();
      const csv = toCsv(beerRows);
      if (useLive) {
        await live.saveLiveTapsCsv(csv, live.getStoredAdminKey());
        statusEl.textContent = 'Published live ✓ Website and menu now share the updated tap list.';
        return;
      }
      const js = `window.TAPS_CSV_LOCAL = \`${escapeForTemplateLiteral(csv)}\`;\n`;
      const result = await saveFile('taps-data.js', js);
      statusEl.textContent = {
        saved: 'Saved ✓ Refresh the live site tab to confirm the change.',
        downloaded: 'Downloaded ✓ Replace the old file with this one, then refresh the live site.',
        cancelled: '',
        error: 'Something went wrong — nothing was overwritten.',
      }[result];
    } catch (error) {
      statusEl.textContent = error && error.message
        ? `Couldn’t publish live: ${error.message}`
        : 'Something went wrong — nothing was overwritten.';
    }
  });
});

document.getElementById('export-csv').addEventListener('click', () => {
  renumberTaps();
  downloadBlob('taps.csv', toCsv(beerRows));
});

async function init() {
  setupCollapsibleSections();

  if (live && live.canUseLiveApi()) {
    try {
      await live.loadLiveSiteData();
    } catch (error) {
      console.warn('Live dashboard bootstrap fell back to bundled files.', error);
    }
  }

  setOwnerAccessCode(live ? live.getStoredAdminKey() : '');
  refreshLiveModeStatus();

  content = window.SITE_CONTENT || {};
  fillWordsForm();

  vendorRows = (content.vendors && content.vendors.partners) || [];
  renderVendorRows();

  beerRows = window.TAPS_CSV_LOCAL ? parseCsv(window.TAPS_CSV_LOCAL) : [];
  renderBeerRows();
}

init();
