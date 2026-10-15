// Runs before the React bundle so the first frame already shows the user's wallpaper and font instead of a blank page.
(function () {
  var root = document.documentElement;
  try {
    var bg = localStorage.getItem('glassify:wpBoot');
    if (bg) root.style.background = bg;
  } catch (e) {
    /* storage unavailable: fall back to the default dark background */
  }

  var font = null;
  try {
    font = JSON.parse(localStorage.getItem('glassify:fontBoot') || 'null');
  } catch (e) {
    /* ignore */
  }
  var preload = font ? font.preload : '/fonts/inter-latin.woff2';
  if (preload) {
    var link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = preload;
    document.head.appendChild(link);
  }
  if (font) {
    var style = document.createElement('style');
    style.id = 'glassify-font';
    style.textContent = font.css || '';
    document.head.appendChild(style);
    root.style.setProperty('--font-stack', font.stack);
  }
})();
