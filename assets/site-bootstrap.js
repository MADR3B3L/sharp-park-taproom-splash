(async function () {
  const live = window.SharpParkLiveData;
  if (live && live.canUseLiveApi()) {
    try {
      await live.loadLiveSiteData();
    } catch (error) {
      console.warn('Falling back to bundled site data.', error);
    }
  }

  applyContent();
  await renderTapGrid();
  initSplash();
})();
