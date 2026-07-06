(async function () {
  const live = window.SharpParkLiveData;
  if (live && live.canUseLiveApi()) {
    try {
      await live.loadLiveSiteData();
    } catch (error) {
      console.warn('Falling back to bundled tap data.', error);
    }
  }

  await renderMenuList();
})();
