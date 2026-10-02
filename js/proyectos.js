document.addEventListener("DOMContentLoaded", function () {
  var lista = document.getElementById("proyectos-lista");
  var intro = document.getElementById("proyectos-intro");
  var resizeTimer;

  initHeroScroll();
  initHeroLuces();

  if (!lista) return;

  fetch("data/proyectos.json?v=3")
    .then(function (res) {
      if (!res.ok) throw new Error("No se pudo cargar proyectos.json");
      return res.json();
    })
    .then(function (data) {
      if (intro && data.intro) {
        intro.textContent = data.intro;
      }

      var items = Array.isArray(data.proyectos) ? data.proyectos : [];
      if (!items.length) {
        lista.innerHTML =
          '<p class="proyectos-vacio">Todavía no hay proyectos publicados.</p>';
        return;
      }

      lista.innerHTML = "";
      items.forEach(function (p) {
        lista.appendChild(crearTarjeta(p));
      });

      programarAjusteVideos();
      window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(ajustarVideosProporcion, 150);
      });
    })
    .catch(function () {
      lista.innerHTML =
        '<p class="proyectos-error">No pudimos cargar la lista de proyectos.</p>';
    });

  function crearTarjeta(p) {
    var article = document.createElement("article");
    article.className = "proyecto-showcase reveal";

    var texto = document.createElement("div");
    texto.className = "proyecto-texto";

    if (p.tipo || p.ubicacion) {
      var meta = document.createElement("div");
      meta.className = "proyecto-meta";
      if (p.tipo) meta.appendChild(crearTag(p.tipo, false));
      if (p.ubicacion) meta.appendChild(crearTag(p.ubicacion, true));
      texto.appendChild(meta);
    }

    if (p.titulo) {
      var h2 = document.createElement("h2");
      h2.className = "proyecto-titulo";
      h2.textContent = p.titulo;
      texto.appendChild(h2);
    }

    if (p.descripcion) {
      var desc = document.createElement("div");
      desc.className = "proyecto-descripcion";
      p.descripcion.split(/\n\n+/).forEach(function (bloque) {
        var trimmed = bloque.trim();
        if (!trimmed) return;
        var par = document.createElement("p");
        par.textContent = trimmed;
        desc.appendChild(par);
      });
      texto.appendChild(desc);
    }

    var media = document.createElement("div");
    media.className = "proyecto-media";
    if (p.video) {
      var frame = document.createElement("div");
      frame.className = "proyecto-video-frame";
      montarVideo(frame, rutasVideo(p));
      media.appendChild(frame);
    }

    article.appendChild(texto);
    article.appendChild(media);
    return article;
  }

  function rutasVideo(p) {
    if (window.ItuarteProyectoVideo && window.ItuarteProyectoVideo.rutasVideo) {
      return window.ItuarteProyectoVideo.rutasVideo(p);
    }
    return p.video ? [p.video] : [];
  }

  function montarVideo(frame, rutas) {
    var idx = 0;
    var video = document.createElement("video");
    video.className = "proyecto-video";
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";

    function mostrarError() {
      frame.innerHTML = "";
      var msg = document.createElement("p");
      msg.className = "proyecto-video-error";
      msg.textContent =
        "No se encontró el video. Revisá que el archivo exista en img/proyectos/.";
      frame.appendChild(msg);
    }

    function cargarSiguiente() {
      if (idx >= rutas.length) {
        mostrarError();
        return;
      }
      var src = rutas[idx++];
      video.src = src;
      video.load();
    }

    video.addEventListener("error", cargarSiguiente);
    video.addEventListener("loadedmetadata", programarAjusteVideos);
    frame.appendChild(video);
    cargarSiguiente();
  }

  function programarAjusteVideos() {
    requestAnimationFrame(function () {
      requestAnimationFrame(ajustarVideosProporcion);
    });
  }

  /**
   * Escala el video con su proporción original (sin recorte).
   * Límite: ancho columna y min(alto del texto, tope) para no quedar gigante.
   */
  function ajustarVideosProporcion() {
    var mobile = window.matchMedia("(max-width: 960px)").matches;
    var maxAncho = mobile ? Math.min(window.innerWidth - 48, 400) : 400;
    var topeAlto = mobile ? Math.min(window.innerHeight * 0.5, 380) : 450;
    var minAlto = 200;

    document.querySelectorAll(".proyecto-showcase").forEach(function (row) {
      var texto = row.querySelector(".proyecto-texto");
      var video = row.querySelector(".proyecto-video");
      var frame = row.querySelector(".proyecto-video-frame");
      if (!texto || !video || !frame || !video.videoWidth || !video.videoHeight) {
        return;
      }

      var altoTexto = texto.offsetHeight;
      var maxAlto = mobile
        ? topeAlto
        : Math.max(minAlto, Math.min(altoTexto, topeAlto));

      var vw = video.videoWidth;
      var vh = video.videoHeight;
      var escala = Math.min(maxAncho / vw, maxAlto / vh);

      var w = Math.round(vw * escala);
      var h = Math.round(vh * escala);

      video.style.width = w + "px";
      video.style.height = h + "px";
      frame.style.width = "100%";
      frame.style.height = h + "px";
      frame.style.minHeight = h + "px";
    });
  }

  function crearTag(label, esUbicacion) {
    var span = document.createElement("span");
    span.className = "proyecto-tag" + (esUbicacion ? " proyecto-tag--ubicacion" : "");
    span.textContent = label;
    return span;
  }

  function initHeroLuces() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.body.classList.add("proyectos-luces-on");
      return;
    }
    document.body.classList.add("proyectos-luces-on");
  }

  function initHeroScroll() {
    var hero = document.getElementById("proyectos-hero");
    var bar = document.getElementById("proyectos-hero-bar");
    if (!hero) return;

    var threshold = 48;

    function onScroll() {
      var scrolled = window.scrollY > threshold;
      document.body.classList.toggle("proyectos-scrolled", scrolled);
      if (bar) {
        bar.setAttribute("aria-hidden", scrolled ? "false" : "true");
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
});
