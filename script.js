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

