// Inicializar Swiper
const swiper = new Swiper('.swiper', {
  loop: true,
  autoplay: {
    delay: 4000,
    disableOnInteraction: false,
  },
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  speed: 800,
});
//
// Animación de aparición de secciones al hacer scroll
const secciones = document.querySelectorAll('.seccion');

const mostrarSeccion = () => {
  secciones.forEach(seccion => {
    const rect = seccion.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) { 
      seccion.classList.add('visible');
    }
  });
};

// Ejecutar al cargar y al hacer scroll
window.addEventListener('scroll', mostrarSeccion);
window.addEventListener('load', mostrarSeccion);

// JS opcional para activar la animación al cargar (puede sacarse si no la querés)
document.addEventListener('DOMContentLoaded', () => {
  const titulo = document.querySelector('.titulo-seccion');
  if (titulo) {
    // darle una pequeña pausa y activar la clase para lanzar las animaciones
    setTimeout(() => titulo.classList.add('animate'), 120);
  }
});

// script.js
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

const swiper2 = new Swiper('.swiper2', {
  loop: true,
  autoplay: {
    delay: 4000,
    disableOnInteraction: false,
  },
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  speed: 800,
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


