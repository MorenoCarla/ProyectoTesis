(function () {
  const VITRINAS_JS_VERSION = "36-novedades-coverflow";
  const NOVEDADES_AUTOPLAY_MS = 5500;
  const NOVEDADES_SPEED_MS = 780;
  const IDEAS_THUMBS_AUTOPLAY_MS = 3200;
  const IDEAS_HERO_AUTOPLAY_MS = 5400;
  const IDEAS_HERO_FADE_MS = 920;
  const API = "/public/catalogo/home-vitrinas";
  const root = document.getElementById("home-vitrinas");
  const aviso = document.getElementById("home-vitrinas-aviso");
  if (!root) return;
  root.dataset.vitrinasJs = VITRINAS_JS_VERSION;

  function esc(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function showAviso(texto) {
    root.hidden = false;
    if (aviso) {
      aviso.hidden = false;
      aviso.textContent = texto;
    }
  }

  function hideAviso() {
    if (aviso) {
      aviso.hidden = true;
      aviso.textContent = "";
    }
  }

  function observeVitrinaReveal(container) {
    if (!container) return;
    const reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const heads = container.querySelectorAll(".home-vitrina-head-reveal");
    const cards = container.querySelectorAll(".home-vitrina-reveal");
    if (!heads.length && !cards.length) return;

    if (reduce) {
      heads.forEach((el) => el.classList.add("home-vitrina-head-visible"));
      cards.forEach((el) => el.classList.add("home-vitrina-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const t = e.target;
          if (t.classList.contains("home-vitrina-head-reveal")) {
            t.classList.add("home-vitrina-head-visible");
          } else {
            t.classList.add("home-vitrina-visible");
          }
          io.unobserve(t);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -20px 0px" }
    );

    cards.forEach((el, i) => {
      el.style.setProperty("--vitrina-i", String(i));
      io.observe(el);
    });
    heads.forEach((el) => io.observe(el));
  }

  function renderNovedades(items) {
    const wrap = document.getElementById("home-vitrinas-novedades");
    const shell = document.getElementById("home-novedades-swiper-shell");
    if (!wrap || !shell || !items.length) return;

    const slides = items
      .map((p) => {
        const banner = (p.home_novedades_banner || "").trim();
        if (banner) {
          return (
            `<div class="swiper-slide">` +
            `<a class="home-novedades-banner-link" href="${esc(p.url)}">` +
            `<img src="${esc(banner)}" alt="${esc(p.nombre)}" width="1400" height="560" loading="lazy" decoding="async">` +
            `</a></div>`
          );
        }
        const amb = p.imagen_ambiente || p.imagen_tarjeta || p.imagen_producto;
        return (
          `<div class="swiper-slide">` +
          `<a class="home-nov-slide" href="${esc(p.url)}">` +
          `<img class="home-nov-slide-bg" src="${esc(amb)}" alt="" loading="lazy" decoding="async">` +
          `<span class="home-nov-slide-shade" aria-hidden="true"></span>` +
          `<span class="home-nov-slide-body">` +
          `<span class="home-nov-slide-cat">${esc(p.categoria)}</span>` +
          `<strong>${esc(p.nombre)}</strong>` +
          `<span class="home-nov-slide-cta">Ver producto <i class="fas fa-arrow-right" aria-hidden="true"></i></span>` +
          `</span></a></div>`
        );
      })
      .join("");

    shell.innerHTML =
      `<div class="swiper home-novedades-swiper" id="home-novedades-swiper">` +
      `<div class="swiper-wrapper">${slides}</div>` +
      `<div class="swiper-pagination"></div>` +
      `</div>`;

    wrap.hidden = false;
    observeVitrinaReveal(wrap);

    if (typeof Swiper !== "undefined") {
      const multi = items.length > 1;
      const el = document.getElementById("home-novedades-swiper");
      if (el && el.swiper) el.swiper.destroy(true, true);
      shell.classList.toggle("home-vitrinas-media--coverflow", multi);
      new Swiper("#home-novedades-swiper", {
        loop: multi,
        speed: NOVEDADES_SPEED_MS,
        effect: multi ? "coverflow" : "slide",
        grabCursor: multi,
        centeredSlides: multi,
        slidesPerView: multi ? 1.12 : 1,
        coverflowEffect: {
          rotate: 22,
          stretch: 0,
          depth: 160,
          modifier: 1.1,
          slideShadows: false,
        },
        autoplay: multi
          ? {
              delay: NOVEDADES_AUTOPLAY_MS,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
              waitForTransition: false,
            }
          : false,
        pagination: { el: "#home-novedades-swiper .swiper-pagination", clickable: true },
      });
    }
  }

  function renderNuevos(items) {
    const wrap = document.getElementById("home-vitrinas-nuevos");
    const grid = document.getElementById("home-nuevos-grid");
    if (!wrap || !grid || !items.length) return;

    grid.innerHTML = items
      .map(
        (p, i) =>
          `<a class="home-product-chip home-vitrina-reveal" href="${esc(p.url)}" style="--vitrina-i:${i}">` +
          `<div class="home-product-chip-photo">` +
          `<span class="home-product-chip-badge">Nuevo</span>` +
          `<img src="${esc(p.imagen_tarjeta || p.imagen_producto)}" alt="${esc(p.nombre_grilla || p.nombre)}" loading="lazy" decoding="async">` +
          `</div>` +
          `<span class="home-product-chip-name">${esc(p.nombre_grilla || p.nombre)}</span>` +
          `<span class="home-product-chip-cat">${esc(p.categoria)}</span>` +
          `</a>`
      )
      .join("");
    wrap.hidden = false;
    observeVitrinaReveal(wrap);
  }

  function ideasLead(p) {
    const lead = (p.home_ideas_lead && String(p.home_ideas_lead).trim()) || "";
    if (lead) return lead;
    const sub = (p.subtitulo && String(p.subtitulo).trim()) || "";
    if (sub) return sub;
    return "Consultá la ficha para ver dónde aplicar.";
  }

  function ideasProductKey(p) {
    if (p == null) return "";
    if (p.id != null && p.id !== "") return `id:${p.id}`;
    if (p.url) return `url:${p.url}`;
    return `n:${p.nombre || ""}`;
  }

  /** Velo izquierdo más claro si la foto es clara; más oscuro si la foto es oscura. */
  function tuneIdeasCopyTone(scope) {
    (scope || document).querySelectorAll(".home-ideas-feature-copy").forEach((copy) => {
      const img = copy.querySelector(".home-ideas-feature-copy-bg img");
      if (!img) return;
      const apply = () => {
        let avg = 0.45;
        try {
          if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            const canvas = document.createElement("canvas");
            const size = 28;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, size, size);
              const pixels = ctx.getImageData(0, 0, size, size).data;
              let sum = 0;
              for (let i = 0; i < pixels.length; i += 4) {
                sum += 0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];
              }
              avg = sum / (pixels.length / 4) / 255;
            }
          }
        } catch (_) {
          /* sin canvas (CORS u otro) */
        }

        let shade;
        let blurBright;
        if (avg < 0.32) {
          shade = 0.64;
          blurBright = 0.88;
          copy.classList.remove("home-ideas-feature-copy--light");
        } else if (avg < 0.48) {
          shade = 0.5;
          blurBright = 0.98;
          copy.classList.remove("home-ideas-feature-copy--light");
        } else if (avg < 0.62) {
          shade = 0.34;
          blurBright = 1.06;
          copy.classList.add("home-ideas-feature-copy--light");
        } else {
          shade = 0.24;
          blurBright = 1.14;
          copy.classList.add("home-ideas-feature-copy--light");
        }
        copy.style.setProperty("--ideas-copy-shade", String(shade));
        copy.style.setProperty("--ideas-blur-bright", String(blurBright));
      };
      if (img.complete && img.naturalWidth) apply();
      else img.addEventListener("load", apply, { once: true });
    });
  }

  function ideasFeatureSlideHtml(p) {
    const img = p.imagen_ambiente || p.imagen_tarjeta || p.imagen_producto;
    const name = p.nombre_grilla || p.nombre;
    return (
      `<a class="home-ideas-feature" href="${esc(p.url)}" data-product-key="${esc(ideasProductKey(p))}">` +
      `<span class="home-ideas-feature-copy">` +
      `<span class="home-ideas-feature-copy-bg" aria-hidden="true">` +
      `<img src="${esc(img)}" alt="" loading="lazy" decoding="async">` +
      `</span>` +
      `<span class="home-ideas-feature-copy-body">` +
      `<span class="home-ideas-feature-tag">${esc(ideasTag(p.categoria))}</span>` +
      `<strong class="home-ideas-feature-title">${esc(name)}</strong>` +
      `<span class="home-ideas-feature-lead">${esc(ideasLead(p))}</span>` +
      `<span class="home-ideas-feature-cta">Ver producto</span>` +
      `</span></span>` +
      `<span class="home-ideas-feature-photo">` +
      `<img class="home-ideas-feature-img" src="${esc(img)}" alt="${esc(name)}" loading="lazy" decoding="async">` +
      `</span></a>`
    );
  }

  function ideasTag(categoria) {
    const c = String(categoria || "").trim();
    if (!c) return "Luminaria";
    if (/^para\s/i.test(c)) return c.toUpperCase();
    return c.toUpperCase();
  }

  function renderIdeas(heroItems, carruselItems) {
    const wrap = document.getElementById("home-vitrinas-ideas");
    const heroShell = document.getElementById("home-ideas-hero-shell");
    const carruselShell = document.getElementById("home-ideas-carrusel-shell");
    const heroItemsList = heroItems || [];
    const carruselItemsList = carruselItems || [];
    if (!wrap || !heroShell || !carruselShell) return;
    if (!heroItemsList.length && !carruselItemsList.length) return;

    heroShell.innerHTML = "";
    carruselShell.innerHTML = "";
    carruselShell.hidden = !carruselItemsList.length;
    heroShell.hidden = false;

    if (heroItemsList.length) {
      const heroSlides = heroItemsList
        .map((p) => `<div class="swiper-slide">${ideasFeatureSlideHtml(p)}</div>`)
        .join("");

      heroShell.innerHTML =
        `<div class="swiper home-ideas-hero-swiper" id="home-ideas-hero-swiper">` +
        `<div class="swiper-wrapper">${heroSlides}</div>` +
        `</div>`;

      const heroSwiperEl = heroShell.querySelector("#home-ideas-hero-swiper");
      if (heroSwiperEl && heroSwiperEl.swiper) {
        heroSwiperEl.swiper.destroy(true, true);
      }
      if (typeof Swiper !== "undefined" && heroItemsList.length > 1) {
        root.dataset.ideasAutoplayMs = String(IDEAS_HERO_AUTOPLAY_MS);
        new Swiper("#home-ideas-hero-swiper", {
          loop: true,
          speed: IDEAS_HERO_FADE_MS,
          effect: "fade",
          fadeEffect: { crossFade: true },
          autoplay: {
            delay: IDEAS_HERO_AUTOPLAY_MS,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
            waitForTransition: false,
          },
        });
      }
      tuneIdeasCopyTone(heroShell);
    } else if (carruselItemsList.length) {
      heroShell.innerHTML =
        `<div class="home-ideas-hero-empty" role="status">` +
        `<p><strong>Falta el banner grande.</strong> En el CRM, en cada producto que quieras arriba, tildá ` +
        `<strong>Ideas — foto grande arriba</strong> (es aparte del carrusel de abajo) y usá «Guardar y publicar».</p>` +
        `</div>`;
    } else {
      heroShell.hidden = true;
    }

    if (carruselItemsList.length) {
      const thumbSlides = carruselItemsList
        .map((p) => {
          const img = p.imagen_ambiente || p.imagen_tarjeta || p.imagen_producto;
          const name = p.nombre_grilla || p.nombre;
          return (
            `<div class="swiper-slide">` +
            `<a class="home-ideas-thumb" href="${esc(p.url)}" title="${esc(name)}">` +
            `<span class="home-ideas-thumb-frame">` +
            `<img src="${esc(img)}" alt="" loading="lazy" decoding="async">` +
            `</span>` +
            `<span class="home-ideas-thumb-name">${esc(name)}</span>` +
            `</a></div>`
          );
        })
        .join("");

      carruselShell.innerHTML =
        `<div class="swiper home-ideas-thumbs-swiper" id="home-ideas-thumbs-swiper">` +
        `<div class="swiper-wrapper">${thumbSlides}</div>` +
        `</div>`;

      const thumbsSwiperEl = carruselShell.querySelector("#home-ideas-thumbs-swiper");
      if (thumbsSwiperEl && thumbsSwiperEl.swiper) {
        thumbsSwiperEl.swiper.destroy(true, true);
      }
      if (typeof Swiper !== "undefined") {
        const n = carruselItemsList.length;
        new Swiper("#home-ideas-thumbs-swiper", {
          slidesPerView: 6,
          spaceBetween: 18,
          speed: 650,
          loop: n > 6,
          grabCursor: true,
          watchOverflow: true,
          autoplay:
            n > 1
              ? {
                  delay: IDEAS_THUMBS_AUTOPLAY_MS,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                  waitForTransition: false,
                }
              : false,
          breakpoints: {
            0: { slidesPerView: 2.4, spaceBetween: 12 },
            520: { slidesPerView: 3.4, spaceBetween: 14 },
            720: { slidesPerView: 4.2, spaceBetween: 16 },
            960: { slidesPerView: 6, spaceBetween: 18 },
          },
        });
      }
    }

    wrap.hidden = false;
    observeVitrinaReveal(wrap);
  }

  fetch(API, { headers: { Accept: "application/json" } })
    .then(async (r) => {
      if (!r.ok) {
        const t = await r.text();
        throw new Error(t || r.statusText);
      }
      return r.json();
    })
    .then((data) => {
      if (data.migracion_pendiente) {
        showAviso(
          "Falta actualizar la base: en backend ejecutá npm run migrate-catalogo-home-vitrinas y reiniciá el servidor."
        );
        return;
      }

      if (data.migracion_ideas_dual) {
        showAviso(
          "Falta la columna «foto grande arriba»: en backend ejecutá npm run migrate-catalogo-home-ideas-dual y reiniciá."
        );
      }

      const novedades = data.novedades || [];
      const ideasHero = data.ideas_hero || [];
      let ideasCarrusel = data.ideas_carrusel || [];
      if (!ideasCarrusel.length && Array.isArray(data.ideas) && data.ideas.length) {
        ideasCarrusel = data.ideas;
      }
      const nuevos = data.nuevos || [];

      if (!novedades.length && !ideasHero.length && !ideasCarrusel.length && !nuevos.length) {
        const local =
          location.hostname === "localhost" || location.hostname === "127.0.0.1";
        if (local) {
          showAviso(
            "Todavía no hay productos en la vitrina. CRM → Vitrina en la Home → tildar y «Guardar y publicar»."
          );
        } else {
          root.hidden = true;
        }
        return;
      }

      hideAviso();
      root.hidden = false;
      if (data.vitrinas_version != null) {
        root.dataset.vitrinasApi = String(data.vitrinas_version);
      }
      renderNovedades(novedades);
      renderNuevos(nuevos);
      renderIdeas(ideasHero, ideasCarrusel);
    })
    .catch(() => {
      const local = location.hostname === "localhost" || location.hostname === "127.0.0.1";
      if (local) {
        showAviso(
          "No se pudo cargar la vitrina. Usá http://localhost:3000/ con el backend encendido."
        );
      } else {
        root.hidden = true;
      }
    });
})();
