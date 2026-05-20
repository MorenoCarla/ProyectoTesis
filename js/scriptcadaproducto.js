new Swiper('.swiper-producto', {
  slidesPerView: 1,
  loop: true,
  autoHeight: true,
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
});
new Swiper(".otrosSwiper", {
  slidesPerView: 6,       
  slidesPerGroup: 1,      
  spaceBetween: 20,
  loop: true,             
  speed: 800,
  autoplay: {
    delay: 2000,          
    disableOnInteraction: false, 
  },

  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },

  breakpoints: {
    320: { slidesPerView: 2 },
    768: { slidesPerView: 4 },
    1024: { slidesPerView: 6 }
  }
});
const scrollTopBtn = document.getElementById('scroll-top');

window.addEventListener('scroll', () => {
  if (window.scrollY > 300) { // aparece después de 300px
    scrollTopBtn.style.opacity = '1';
  } else {
    scrollTopBtn.style.opacity = '0';
  }
});

scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});

function revealOnScroll() {
  const elements = document.querySelectorAll('.reveal');

  elements.forEach(el => {
    const windowHeight = window.innerHeight;
    const elementTop = el.getBoundingClientRect().top;
    const elementVisible = 100; // margen antes de aparecer

    if (elementTop < windowHeight - elementVisible) {
      el.classList.add("active");
    } else {
      el.classList.remove("active"); // si querés que desaparezcan al salir
    }
  });
}
window.addEventListener("scroll", revealOnScroll);




