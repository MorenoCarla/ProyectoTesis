/**
 * Rutas de video con alternativas (mayúsculas / .MOV) para GitHub Pages (Linux).
 */
window.ItuarteProyectoVideo = {
  /** Ejecuta fn cuando el elemento entra (o está cerca) del viewport. */
  whenVisible: function (el, fn) {
    if (!el || typeof fn !== "function") return;
    if (!("IntersectionObserver" in window)) {
      fn();
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          fn();
          io.disconnect();
        });
      },
      { rootMargin: "120px", threshold: 0.05 }
    );
    io.observe(el);
  },

  /** Rutas a probar si falla la carga (solo la principal + alternativos explícitos en JSON). */
  rutasVideo: function (p) {
    var rutas = [];
    function push(u) {
      if (u && rutas.indexOf(u) === -1) rutas.push(u);
    }
    push(p.video);
    if (Array.isArray(p.videoAlternativos)) {
      p.videoAlternativos.forEach(push);
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
    video.preload = "none";

    function tryNext() {
      if (idx >= rutas.length) return;
      video.src = rutas[idx++];
      video.load();
    }

    function onOk() {
      video.removeEventListener("error", tryNext);
      video.play().catch(function () {});
    }

    video.addEventListener("error", tryNext);
    video.addEventListener("loadeddata", onOk, { once: true, passive: true });

    tryNext();
  },
};
