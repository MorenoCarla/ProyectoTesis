document.addEventListener("DOMContentLoaded", () => {
  const el = document.querySelector(".testimonial-swiper");
  if (el) {
    new Swiper(".testimonial-swiper", {
      loop: true,
      navigation: {
        nextEl: ".testimonial-swiper .swiper-button-next",
        prevEl: ".testimonial-swiper .swiper-button-prev",
      },
      pagination: {
        el: ".testimonial-swiper .swiper-pagination",
        clickable: true,
      },
    });
  }
});
