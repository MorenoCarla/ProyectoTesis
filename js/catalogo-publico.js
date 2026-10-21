/**
 * Catálogo web dinámico — datos desde /public/catalogo (MySQL vía CRM).
 */
(function (global) {
  const API = "/public/catalogo";

  async function fetchJson(url) {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      let msg = res.statusText;
      try {
        const j = await res.json();
        if (j.error) msg = j.error;
      } catch (_) {}
      throw new Error(msg);
    }
    return res.json();
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

  const FILAS = [
    "uno",
    "dos",
    "tres",
    "cuatro",
    "cinco",
    "seis",
    "siete",
    "ocho",
    "nueve",
    "diez",
    "once",
    "doce",
    "trece",
    "catorce",
    "quince",
    "dieciseis",
    "diecisiete",
    "extra"
  ];

  function renderGrillaHtml(productos) {
    if (!productos.length) {
      return `<p class="catalogo-grilla-vacio">No hay productos publicados en esta categoría.</p>`;
    }
    const POR_FILA = 5;
    const filas = [];
    for (let i = 0; i < productos.length; i += POR_FILA) {
      const chunk = productos.slice(i, i + POR_FILA);
      const filaClass = FILAS[Math.floor(i / POR_FILA)] || "extra";
      const items = chunk
        .map((p, j) => {
          const idx = ((i + j) % 5) + 1;
          const nombre = p.nombre_grilla || p.nombre || p.slug;
          const cod = p.codigos_texto || (p.codigos || []).join(", ");
          const img = p.imagen || "img/LOGO.png";
          const href = p.url || `/p/${encodeURIComponent(p.slug)}`;
          const slug = p.slug || "";
          return `
                    <a href="${esc(href)}" class="link-producto">
                        <div class="imagen ${idx}" data-slug="${escAttr(slug)}" data-nombre="${escAttr(nombre)}" data-codigo="${escAttr(cod)}">
                            <img src="${esc(img)}" alt="${esc(nombre)}" loading="lazy">
                            <p class="p${idx}">${esc(nombre)}</p>
                        </div>
                    </a>`;
        })
        .join("\n");
      filas.push(`                <div class="fila ${filaClass}">\n${items}\n                </div>`);
    }
    return filas.join("\n");
  }

  async function cargarGrillaPorListado(archivoListado) {
    const file = encodeURIComponent(archivoListado.replace(/^\//, ""));
    const data = await fetchJson(`${API}/listado/${file}/productos`);
    return data;
  }

  async function cargarProducto(slug) {
    const data = await fetchJson(`${API}/productos/${encodeURIComponent(slug)}`);
    return data.producto;
  }

  function slugDesdePathname() {
    const m = global.location.pathname.match(/\/p\/([^/]+)\/?$/i);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function initGrillaCategoria() {
    const grid = document.querySelector("section.cat-catalog-grid[data-catalogo-dinamico]");
    if (!grid) return Promise.resolve();

    const listado = grid.getAttribute("data-catalogo-listado");
    if (!listado) {
      grid.innerHTML = '<p class="catalogo-grilla-error">Falta data-catalogo-listado en la página.</p>';
      return Promise.resolve();
    }

    grid.innerHTML = '<p class="catalogo-grilla-cargando">Cargando productos…</p>';

    return cargarGrillaPorListado(listado)
      .then((data) => {
        grid.innerHTML = renderGrillaHtml(data.productos || []);
        document.dispatchEvent(new CustomEvent("catalogo-grilla-ready", { detail: data }));
      })
      .catch((err) => {
        grid.innerHTML = `<p class="catalogo-grilla-error">No se pudo cargar el catálogo: ${esc(err.message)}</p>`;
      });
  }

  const RELACIONADOS_MIN = 8;

  function pickRelacionados(productos, currentSlug) {
    if (!productos.length) return [];
    const idx = productos.findIndex((p) => p.slug === currentSlug);
    const start = idx >= 0 ? idx + 1 : 0;
    const picked = [];
    for (let i = 0; picked.length < RELACIONADOS_MIN && i < productos.length * 2; i++) {
      const item = productos[(start + i) % productos.length];
      if (item.slug === currentSlug) continue;
      if (picked.some((p) => p.slug === item.slug)) continue;
      picked.push(item);
    }
    return picked;
  }

  function slideRelacionadoHtml(p, index) {
    const pClass = "p" + ((index % 5) + 1);
    const nombre = p.nombre_grilla || p.nombre || p.slug;
    const href = p.url || `/p/${encodeURIComponent(p.slug)}`;
    const img = p.imagen || "img/LOGO.png";
    return (
      `<div class="swiper-slide"><a href="${esc(href)}">` +
      `<img src="${esc(img)}" alt="${esc(nombre)}" loading="lazy">` +
      `<p class="${pClass}">${esc(nombre)}</p></a></div>`
    );
  }

  function slideVerMasHtml(listadoUrl, categoriaNombre) {
    const cat = (categoriaNombre || "productos").toLowerCase();
    return (
      `<div class="swiper-slide ver-mas"><a href="${esc(listadoUrl)}">` +
      `<div class="contenido-ver-mas"><h4>Ver todos <br>los ${esc(cat)}</h4><span>→</span></div></a></div>`
    );
  }

  async function renderRelacionadosCategoria(producto) {
    const section = document.querySelector("[data-catalogo-relacionados]");
    if (!section) return;

    const catNombre = producto.categoria?.nombre || "productos";
    const titulo = section.querySelector("h2");
    if (titulo) titulo.textContent = `DESCUBRÍ MÁS ${catNombre.toUpperCase()}!`;

    const listado = producto.categoria?.pagina_listado;
    const listadoUrl = listado ? `/${listado}` : "productos.html";
    const wrapper = section.querySelector(".otrosSwiper .swiper-wrapper");
    if (!wrapper) return;

    if (!listado) {
      section.hidden = true;
      return;
    }

    try {
      const data = await cargarGrillaPorListado(listado);
      const productos = data.productos || [];
      const picked = pickRelacionados(productos, producto.slug);

      if (!picked.length) {
        wrapper.innerHTML = slideVerMasHtml(listadoUrl, catNombre);
      } else {
        wrapper.innerHTML =
          picked.map((p, i) => slideRelacionadoHtml(p, i)).join("\n") +
          slideVerMasHtml(listadoUrl, catNombre);
      }
      section.hidden = false;
    } catch (err) {
      console.warn("[catalogo] relacionados:", err);
      wrapper.innerHTML = slideVerMasHtml(listadoUrl, catNombre);
    }
  }

  function ordenarImagenesFichaLocal(imagenes) {
    if (global.FichaProductoTema?.ordenarImagenesFicha) {
      return global.FichaProductoTema.ordenarImagenesFicha(imagenes);
    }
    return imagenes || [];
  }

  function finalizarFichaProducto(producto) {
    document.dispatchEvent(new CustomEvent("catalogo-ficha-ready", { detail: producto }));
  }

  function svgColor(hex) {
    const fill = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/i.test(hex || "") ? hex : "#bdbdbd";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><circle cx="28" cy="28" r="26" fill="${fill}" stroke="#777" stroke-width="1"/></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  function renderFicha(producto) {
    document.title = producto.nombre || "Producto";
    const root = document.querySelector("[data-catalogo-ficha]");
    if (!root) return;

    if (global.FichaProductoTema?.aplicarTemaFichaProducto) {
      global.FichaProductoTema.aplicarTemaFichaProducto(producto);
    } else {
      root.dataset.producto = producto.nombre || "";
      root.dataset.categoria = producto.categoria?.nombre || "";
    }

    producto.imagenes = ordenarImagenesFichaLocal(producto.imagenes || []);

    const volver = document.querySelector(".btn-volver");
    if (volver && producto.categoria?.pagina_listado) {
      volver.href = `/${producto.categoria.pagina_listado}`;
      volver.textContent = `← Volver a ${(producto.categoria.nombre || "").toLowerCase()}`;
    }

    const wrapper = document.querySelector(".swiper-producto .swiper-wrapper");
    if (wrapper) {
      wrapper.innerHTML = (producto.imagenes || [])
        .map(
          (src) =>
            `<div class="swiper-slide"><img src="${esc(src)}" alt="${esc(producto.nombre)}"></div>`
        )
        .join("\n");
    }

    const subt = document.querySelector(".subtitulo");
    if (subt) subt.textContent = producto.subtitulo || "";

    const tit = document.querySelector(".titulo strong");
    if (tit) tit.textContent = (producto.nombre || "").toUpperCase();

    const carac = document.querySelector(".caracteristicas");
    if (carac) {
      const parts = producto.caracteristicas || [];
      carac.innerHTML = parts.map((t) => `<p>${esc(t)}</p>`).join("\n");
    }

    const desc = document.querySelector(".textodescripcion");
    if (desc) {
      const raw = producto.descripcion_html || producto.descripcion_texto || "";
      if (/<[a-z][\s\S]*>/i.test(raw)) desc.innerHTML = raw;
      else desc.textContent = raw;
    }

    const bloqueCodigos = document.getElementById("bloque-codigos-producto");
    const wrapColores = document.querySelector(".imagenes-colores");
    const wrapCodigos = document.querySelector(".texto-codigos");

    if (producto.sin_colores) {
      if (bloqueCodigos) bloqueCodigos.hidden = true;
    } else {
      if (bloqueCodigos) bloqueCodigos.hidden = false;
      const colores = producto.colores || [];
      if (wrapColores) {
        wrapColores.innerHTML = colores
          .map((c) => {
            let src = (c.imagen || "").trim();
            if (!src && c.hex) src = svgColor(c.hex);
            if (!src) return "";
            return `<img src="${esc(src)}" alt="${esc(c.etiqueta || c.codigo)}">`;
          })
          .filter(Boolean)
          .join("\n");
      }
      wrapCodigos.innerHTML = colores
        .map((c) => `<p class="codigocolor">${esc(String(c.codigo || "").trim())}</p>`)
        .join("\n");
    }

    const btnPdf = document.querySelector(".boton-descargas");
    if (btnPdf && producto.catalogo_pdf) {
      btnPdf.href = producto.catalogo_pdf;
      btnPdf.textContent = producto.categoria?.nombre
        ? `Catálogo ${producto.categoria.nombre}`
        : "Catálogo";
    }

  }

  function initFichaProducto() {
    const root = document.querySelector("[data-catalogo-ficha]");
    if (!root) return Promise.resolve();
    const slug = slugDesdePathname();
    if (!slug) {
      root.innerHTML = "<p>No se indicó producto.</p>";
      return Promise.resolve();
    }
    return cargarProducto(slug)
      .then(async (producto) => {
        renderFicha(producto);
        await renderRelacionadosCategoria(producto);
        finalizarFichaProducto(producto);
      })
      .catch((err) => {
        const tit = document.querySelector(".titulo strong");
        if (tit) tit.textContent = "Producto no disponible";
        const desc = document.querySelector(".textodescripcion");
        if (desc) {
          desc.textContent =
            err.message +
            ". Verificá que el producto esté publicado en el CRM y que el backend esté reiniciado.";
        }
      });
  }

  global.CatalogoPublico = {
    API,
    cargarGrillaPorListado,
    cargarProducto,
    initGrillaCategoria,
    initFichaProducto,
    renderGrillaHtml
  };

  document.addEventListener("DOMContentLoaded", () => {
    initGrillaCategoria();
    initFichaProducto();
  });
})(window);
