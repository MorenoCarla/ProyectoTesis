(function () {
  const API = "/public/proximamente";
  const LS_KEY = "ituarte_prox_vkey";
  const LS_LIKES = "ituarte_prox_liked";

  const MARQUEE_CATEGORIAS = [
    "Próximamente",
    "Novedades",
    "Consultanos",
    "Apliques",
    "Colgantes",
    "Veladores",
    "Plafones",
    "Espejos",
    "Lámparas de pie",
    "Bifocales",
    "Unifocales",
    "Farolas",
    "Estacas",
    "Tortugas",
    "Reflectores",
    "Luminaria de pileta",
    "Solares",
    "Paneles",
    "Smarts",
    "Alumbrado público",
    "Ventiladores",
    "Cámaras",
    "Ituarte Sur"
  ];

  function initMarquee() {
    const track = document.getElementById("proxMarqueeTrack");
    if (!track) return;
    const items = MARQUEE_CATEGORIAS.concat(MARQUEE_CATEGORIAS);
    track.innerHTML = items.map((label) => `<span>${esc(label)}</span>`).join("");
  }

  const PROX_HERO_DEFAULT = "img/proximamente-hero.png";

  /** Hero: siempre la imagen fija del proyecto (proximamente-hero.png) */
  function syncHeroImage() {
    const img = document.getElementById("proxHeroImage");
    if (!img) return;
    img.src = PROX_HERO_DEFAULT;
    img.alt = "Luminaria — Próximamente en Ituarte";
  }

  function esc(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escAttr(s) {
    return esc(s).replace(/'/g, "&#39;");
  }

  function visitorKey() {
    try {
      let k = localStorage.getItem(LS_KEY);
      if (!k) {
        k =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : "v" + Date.now() + "-" + Math.random().toString(16).slice(2);
        localStorage.setItem(LS_KEY, k);
      }
      return k;
    } catch (_) {
      return "anon-" + Date.now();
    }
  }

  function likedSet() {
    try {
      const raw = localStorage.getItem(LS_LIKES);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (_) {
      return new Set();
    }
  }

  function markLiked(id) {
    try {
      const s = likedSet();
      s.add(String(id));
      localStorage.setItem(LS_LIKES, JSON.stringify([...s]));
    } catch (_) {}
  }

  function unmarkLiked(id) {
    try {
      const s = likedSet();
      s.delete(String(id));
      localStorage.setItem(LS_LIKES, JSON.stringify([...s]));
    } catch (_) {}
  }

  function applyLikeUi(id, liked, likesCount) {
    document.querySelectorAll(`[data-prox-like="${id}"]`).forEach((b) => {
      b.classList.toggle("is-liked", liked);
      b.setAttribute("aria-pressed", liked ? "true" : "false");
      const icon = b.querySelector("i");
      if (icon) icon.className = liked ? "fas fa-heart" : "fa fa-heart";
    });
    if (likesCount != null) {
      document.querySelectorAll(`[data-like-count="${id}"]`).forEach((el) => {
        el.textContent = likesCount;
      });
    }
    const idx = proxItems.findIndex((p) => String(p.id) === String(id));
    if (idx >= 0 && likesCount != null) proxItems[idx].likes_count = likesCount;
  }

  function toast(msg) {
    const el = document.getElementById("proxToast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("is-visible");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("is-visible"), 2200);
  }

  async function fetchJson(url, opts) {
    const res = await fetch(url, {
      headers: { Accept: "application/json", ...(opts?.headers || {}) },
      ...opts
    });
    let body = null;
    try {
      body = await res.json();
    } catch (_) {}
    if (!res.ok) {
      const raw = body?.error || res.statusText || "Error";
      if (res.status === 404 && /proximamente|Ruta no encontrada/i.test(String(raw))) {
        throw new Error(
          "El servidor no tiene la ruta actualizada. Pará el backend (Ctrl+C) y volvé a ejecutar: cd backend && npm start"
        );
      }
      if (res.status === 503) {
        throw new Error("Ejecutá: npm run migrate-proximamente");
      }
      throw new Error(raw);
    }
    return body;
  }

  let proxItems = [];
  let proxSwiper = null;

  function renderSwiperSlide(item, index) {
    const liked = likedSet().has(String(item.id));
    const imgMain = escAttr(item.imagen);
    const imgHover = escAttr(item.imagen_hover || "");
    const hasHover = Boolean(item.imagen_hover && item.imagen_hover !== item.imagen);
    const tag = item.categoria_etiqueta
      ? `<span class="prox-deck-tag">${esc(item.categoria_etiqueta)}</span>`
      : "";
    const sub = item.subtitulo ? `<p class="prox-deck-sub">${esc(item.subtitulo)}</p>` : "";
    const desc = item.descripcion
      ? `<p class="prox-deck-desc">${esc(item.descripcion)}</p>`
      : "";
    return `
      <div class="swiper-slide">
        <article class="prox-deck-card${hasHover ? " has-hover-image" : ""}">
          <div class="prox-deck-media">
            <img class="prox-deck-img prox-deck-img--main" src="${imgMain}" alt="${escAttr(item.titulo)}" loading="${index < 4 ? "eager" : "lazy"}" decoding="async">
            ${hasHover ? `<img class="prox-deck-img prox-deck-img--hover" src="${imgHover}" alt="" decoding="async">` : ""}
            ${hasHover ? `<span class="prox-deck-hint-montaje">Tocá: ver ambiente</span>` : ""}
          </div>
          <footer class="prox-deck-foot">
            <div class="prox-deck-meta-row">
              <div class="prox-deck-text">
                ${tag}
                <h3 class="prox-deck-title">${esc(item.titulo)}</h3>
              </div>
              <button type="button" class="prox-deck-like${liked ? " is-liked" : ""}" data-prox-like="${item.id}" aria-pressed="${liked ? "true" : "false"}">
                <i class="${liked ? "fas" : "fa"} fa-heart" aria-hidden="true"></i>
                <span data-like-count="${item.id}">${item.likes_count || 0}</span>
              </button>
            </div>
            ${sub}
            ${desc}
          </footer>
          <button type="button" class="prox-deck-avisame" data-prox-consulta="${item.id}" data-prox-titulo="${escAttr(item.titulo)}">
            <i class="fa fa-bell" aria-hidden="true"></i> Avisame cuando llegue
          </button>
        </article>
      </div>`;
  }

  let deckNavBound = false;
  let deckIndex = 0;

  function goDeck(step) {
    const n = proxItems.length;
    if (!proxSwiper || n < 1) return;
    deckIndex = (deckIndex + step + n) % n;
    proxSwiper.slideTo(deckIndex, 480);
  }

  function bindDeckNav() {
    if (deckNavBound) return;
    deckNavBound = true;
    /* Izquierda = siguiente · Derecha = anterior (como pediste) */
    document.getElementById("proxDeckPrev")?.addEventListener("click", () => goDeck(1));
    document.getElementById("proxDeckNext")?.addEventListener("click", () => goDeck(-1));
  }

  function initProxSwiper() {
    if (typeof Swiper === "undefined") return;
    if (proxSwiper) {
      proxSwiper.destroy(true, true);
      proxSwiper = null;
    }
    const el = document.getElementById("proxSwiper");
    if (!el || !proxItems.length) return;

    deckIndex = 0;
    proxSwiper = new Swiper(el, {
      effect: "coverflow",
      grabCursor: true,
      centeredSlides: true,
      slidesPerView: "auto",
      spaceBetween: 24,
      loop: false,
      speed: 480,
      initialSlide: 0,
      watchSlidesProgress: true,
      coverflowEffect: {
        rotate: 20,
        stretch: -6,
        depth: 210,
        modifier: 1.25,
        slideShadows: false
      },
      breakpoints: {
        768: {
          spaceBetween: 30,
          coverflowEffect: { rotate: 24, stretch: -8, depth: 250, modifier: 1.35 }
        }
      },
      on: {
        slideChange(s) {
          deckIndex = s.activeIndex;
          el.querySelectorAll(".prox-deck-card.is-showing-montaje").forEach((card) => {
            card.classList.remove("is-showing-montaje");
            const hint = card.querySelector(".prox-deck-hint-montaje");
            if (hint) hint.textContent = "Tocá: ver ambiente";
          });
        }
      }
    });

    bindDeckNav();
  }

  function bindDeckClicks() {
    const stage = document.getElementById("proxCarouselStage");
    if (!stage || stage.dataset.deckBound === "1") return;
    stage.dataset.deckBound = "1";
    stage.addEventListener("click", (ev) => {
      const likeBtn = ev.target.closest("[data-prox-like]");
      if (likeBtn) {
        toggleLike(likeBtn.getAttribute("data-prox-like"), likeBtn);
        return;
      }
      const media = ev.target.closest(".prox-deck-media");
      if (media) {
        const card = media.closest(".prox-deck-card.has-hover-image");
        if (card) {
          card.classList.toggle("is-showing-montaje");
          const hint = card.querySelector(".prox-deck-hint-montaje");
          if (hint) {
            hint.textContent = card.classList.contains("is-showing-montaje")
              ? "Tocá: ver producto"
              : "Tocá: ver ambiente";
          }
        }
        return;
      }
      const consultaBtn = ev.target.closest("[data-prox-consulta]");
      if (consultaBtn) {
        openConsulta(
          consultaBtn.getAttribute("data-prox-consulta"),
          consultaBtn.getAttribute("data-prox-titulo")
        );
      }
    });
  }

  function initReveal() {
    const els = document.querySelectorAll(".prox-reveal");
    if (!els.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    document.querySelectorAll(".prox-hero .prox-reveal").forEach((el) => {
      requestAnimationFrame(() => el.classList.add("is-in"));
    });
  }

  let consultaItemId = null;

  function openConsulta(id, titulo) {
    consultaItemId = id;
    const dlg = document.getElementById("proxDialogConsulta");
    document.getElementById("proxDialogProducto").textContent = titulo || "";
    const err = document.getElementById("proxDialogError");
    if (err) {
      err.hidden = true;
      err.textContent = "";
    }
    document.getElementById("proxFormConsulta")?.reset();
    dlg?.showModal?.();
  }

  async function toggleLike(id, btn) {
    if (btn.disabled) return;
    btn.disabled = true;
    try {
      const data = await fetchJson(`${API}/items/${id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitor_key: visitorKey() })
      });
      if (data.liked) markLiked(id);
      else unmarkLiked(id);
      applyLikeUi(id, Boolean(data.liked), data.likes_count);
      toast(data.liked ? "¡Gracias por tu interés!" : "Sacamos tu me gusta");
    } catch (e) {
      toast(e.message || "No se pudo actualizar el me gusta");
    } finally {
      btn.disabled = false;
    }
  }

  async function sendConsulta(e) {
    e.preventDefault();
    if (!consultaItemId) return;
    const err = document.getElementById("proxDialogError");
    const btn = document.getElementById("proxBtnEnviarConsulta");
    if (err) {
      err.hidden = true;
      err.textContent = "";
    }
    if (btn) btn.disabled = true;
    try {
      await fetchJson(`${API}/items/${consultaItemId}/consulta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: document.getElementById("proxInputNombre")?.value.trim(),
          telefono: document.getElementById("proxInputTelefono")?.value.trim(),
          mensaje: document.getElementById("proxInputMensaje")?.value.trim()
        })
      });
      document.getElementById("proxDialogConsulta")?.close();
      toast("¡Listo! Te vamos a contactar.");
    } catch (ex) {
      if (err) {
        err.hidden = false;
        err.textContent = ex.message || "No se pudo enviar";
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  async function loadItems() {
    const estado = document.getElementById("proxEstado");
    const stage = document.getElementById("proxCarouselStage");
    const wrapper = document.getElementById("proxSwiperWrapper");
    try {
      const data = await fetchJson(`${API}/items`);
      proxItems = data.items || [];
      syncHeroImage();
      if (!proxItems.length) {
        if (estado) {
          estado.innerHTML = `
            <div class="prox-empty prox-reveal">
              <span class="prox-kicker">Vitrina en preparación</span>
              <h3 class="prox-section-title" style="font-size:1.35rem">Todavía no hay productos publicados</h3>
              <p>Cuando cargues ítems desde el CRM van a aparecer acá en el carrusel.</p>
              <a href="contacto.html" class="prox-btn prox-btn--red">Pedinos algo específico</a>
            </div>`;
          initReveal();
        }
        if (stage) stage.hidden = true;
        return;
      }

      if (wrapper) {
        wrapper.innerHTML = proxItems.map((it, i) => renderSwiperSlide(it, i)).join("");
      }
      if (estado) estado.innerHTML = "";
      if (stage) stage.hidden = false;

      bindDeckClicks();
      initReveal();
      if (typeof Swiper !== "undefined") {
        initProxSwiper();
      } else {
        window.addEventListener("load", initProxSwiper, { once: true });
      }
    } catch (e) {
      if (estado) {
        estado.innerHTML = `<div class="prox-alerta prox-reveal"><p><strong>No pudimos cargar la vitrina.</strong></p><p>${esc(e.message)}</p></div>`;
        initReveal();
      }
    }
  }

  document.getElementById("proxDialogCerrar")?.addEventListener("click", () => {
    document.getElementById("proxDialogConsulta")?.close();
  });
  document.getElementById("proxFormConsulta")?.addEventListener("submit", sendConsulta);

  document.addEventListener("DOMContentLoaded", () => {
    syncHeroImage();
    initMarquee();
    initReveal();
    loadItems();
  });
})();
