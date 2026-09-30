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
});

function initHomeProyectosVideos() {
  const grid = document.getElementById("proyectos-home-grid");
  const utils = window.ItuarteProyectoVideo;
  if (!grid || !utils) return;

  fetch("data/proyectos.json?v=4")
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
        utils.attachPreviewVideo(video, utils.rutasVideo(p));
      });
    })
    .catch(() => {});
}
