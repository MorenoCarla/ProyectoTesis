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
});
