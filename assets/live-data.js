(function () {
  const STORAGE_KEY = 'sharp-park-owner-access-code';

  function getApiBase() {
    const raw = window.SITE_CONFIG && window.SITE_CONFIG.apiBase;
    return raw ? raw.replace(/\/$/, '') : '';
  }

  function buildUrl(path) {
    const base = getApiBase();
    return base ? `${base}${path}` : '';
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function canUseLiveApi() {
    return !!getApiBase();
  }

  async function loadLiveSiteData() {
    const url = buildUrl('/api/site-data');
    if (!url) return null;
    const response = await fetch(`${url}?ts=${Date.now()}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    if (!response.ok) {
      throw new Error(`Live data request failed (${response.status})`);
    }
    const payload = await response.json();
    if (payload && payload.content) {
      window.SITE_CONTENT = clone(payload.content);
    }
    if (payload && typeof payload.tapsCsv === 'string') {
      window.TAPS_CSV_LOCAL = payload.tapsCsv;
    }
    window.SITE_LIVE_META = payload && payload.meta ? payload.meta : null;
    return payload;
  }

  async function postJson(path, body, adminKey) {
    const url = buildUrl(path);
    if (!url) throw new Error('Live API is not configured.');
    if (!adminKey) throw new Error('Owner access code is required.');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      let message = `Save failed (${response.status})`;
      try {
        const json = await response.json();
        if (json && json.error) message = json.error;
      } catch (error) {}
      throw new Error(message);
    }
    return response.json();
  }

  async function saveLiveContent(content, adminKey) {
    const payload = await postJson('/api/content', { content }, adminKey);
    window.SITE_CONTENT = clone(content);
    window.SITE_LIVE_META = payload && payload.meta ? payload.meta : window.SITE_LIVE_META;
    return payload;
  }

  async function saveLiveTapsCsv(tapsCsv, adminKey) {
    const payload = await postJson('/api/taps', { tapsCsv }, adminKey);
    window.TAPS_CSV_LOCAL = tapsCsv;
    window.SITE_LIVE_META = payload && payload.meta ? payload.meta : window.SITE_LIVE_META;
    return payload;
  }

  function getStoredAdminKey() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) || '';
    } catch (error) {
      return '';
    }
  }

  function setStoredAdminKey(value) {
    try {
      if (value) {
        window.localStorage.setItem(STORAGE_KEY, value);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {}
  }

  window.SharpParkLiveData = {
    canUseLiveApi,
    getApiBase,
    getStoredAdminKey,
    loadLiveSiteData,
    saveLiveContent,
    saveLiveTapsCsv,
    setStoredAdminKey
  };
})();
