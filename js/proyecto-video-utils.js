/**
 * Rutas de video con alternativas (mayúsculas / .MOV) para GitHub Pages (Linux).
 */
window.ItuarteProyectoVideo = {
  rutasVideo: function (p) {
    var rutas = [];
    function push(u) {
      if (u && rutas.indexOf(u) === -1) rutas.push(u);
    }
    push(p.video);
    if (Array.isArray(p.videoAlternativos)) {
      p.videoAlternativos.forEach(push);
    }
    if (p.video) {
      var v = p.video;
      if (/\.mp4$/i.test(v)) {
        push(v.replace(/\.mp4$/i, ".MP4"));
        push(v.replace(/\.mp4$/i, ".mov"));
        push(v.replace(/\.mp4$/i, ".MOV"));
      }
      if (/\.mov$/i.test(v)) {
        push(v.replace(/\.mov$/i, ".mp4"));
        push(v.replace(/\.mov$/i, ".MP4"));
      }
    }
    return rutas;
  },

  /** Video muted en loop con reintento de rutas (home, previews). */
  attachPreviewVideo: function (video, rutas) {
    if (!video || !rutas || !rutas.length) return;

    var idx = 0;
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.preload = "metadata";

    function tryNext() {
      if (idx >= rutas.length) return;
      video.src = rutas[idx++];
      video.load();
    }

    video.addEventListener("error", tryNext);
    video.addEventListener(
      "loadeddata",
      function () {
        video.play().catch(function () {});
      },
      { passive: true }
    );

    tryNext();
  },
};
