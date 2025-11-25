const menuIcon = document.getElementById('menu-icon');
const menu = document.getElementById('menu');

// Abrir/cerrar al tocar el ícono
menuIcon.addEventListener('click', (e) => {
  e.stopPropagation(); // evita que el click cierre el menú inmediatamente
  menu.classList.toggle('active');
});

// Cerrar al hacer click fuera
document.addEventListener('click', (e) => {
  if (!menu.contains(e.target) && !menuIcon.contains(e.target)) {
    menu.classList.remove('active');
  }
});

menu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => menu.classList.remove('active'));
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
