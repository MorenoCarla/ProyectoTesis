document.addEventListener("DOMContentLoaded", () => {
  const heroSwiper = document.querySelector(".hero-swiper");
  if (heroSwiper) {
    new Swiper(".hero-swiper", {
      loop: true,
      autoplay: { delay: 4500, disableOnInteraction: false },
      navigation: {
        nextEl: ".hero-swiper .swiper-button-next",
        prevEl: ".hero-swiper .swiper-button-prev",
      },
      pagination: {
        el: ".hero-swiper .swiper-pagination",
        clickable: true,
      },
      speed: 700,
    });
  }

  initHomeProyectosVideos();
  initLazySectionVideos();
});

function applyVideoPosterBackground(video) {
  const poster = video.getAttribute("data-poster") || video.getAttribute("poster");
  if (!poster) return;
  video.poster = poster;
  video.setAttribute("poster", poster);
  video.style.backgroundImage = 'url("' + poster.replace(/"/g, "") + '")';
  video.style.backgroundSize = "cover";
  video.style.backgroundPosition = "center";
  video.style.backgroundRepeat = "no-repeat";
}

function initLazySectionVideos() {
  const utils = window.ItuarteProyectoVideo;
  const whenVisible = utils && utils.whenVisible ? utils.whenVisible.bind(utils) : null;

  document.querySelectorAll("video[data-lazy-src]").forEach((video, idx) => {
    video.preload = "none";
    applyVideoPosterBackground(video);
    const slot = video.closest(".sucursal-video-slot");
    video.addEventListener(
      "playing",
      () => {
        if (slot) slot.classList.add("is-playing");
      },
      { once: true }
    );
    const start = () => {
      const go = () => {
        video.src = video.getAttribute("data-lazy-src");
        video.load();
        video.play().catch(() => {});
      };
      setTimeout(go, idx * 500);
    };
    if (whenVisible) whenVisible(video, start);
    else start();
  });
}

function initHomeProyectosVideos() {
  const grid = document.getElementById("proyectos-home-grid");
  const utils = window.ItuarteProyectoVideo;
  if (!grid || !utils) return;

  fetch("data/proyectos.json?v=5")
    .then((res) => {
      if (!res.ok) throw new Error("proyectos.json");
      return res.json();
    })
    .then((data) => {
      const items = Array.isArray(data.proyectos) ? data.proyectos : [];
      grid.querySelectorAll(".proyectos-home-tile[data-proyecto-index]").forEach((tile) => {
        const i = Number(tile.getAttribute("data-proyecto-index"));
        const p = items[i];
        const video = tile.querySelector("video");
        if (!p || !video) return;
        video.preload = "none";
        const poster = utils.posterForProyecto(p);
        if (poster) video.poster = poster;
        utils.whenVisible(video, () => {
          setTimeout(() => {
            utils.attachPreviewVideo(video, utils.rutasVideo(p));
          }, i * 800);
        });
      });
    })
    .catch(() => {});
}
