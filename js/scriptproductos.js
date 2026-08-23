document.addEventListener("DOMContentLoaded", () => {
  const jumpLinks = document.querySelectorAll(".productos-jump-inner a");
  const sections = document.querySelectorAll(".cat-section[id]");

  jumpLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (!id || !id.startsWith("#")) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--ituarte-header")) || 68;
      const jumpH = document.querySelector(".productos-jump")?.offsetHeight || 0;
      const top = target.getBoundingClientRect().top + window.scrollY - headerH - jumpH - 8;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });

  if (sections.length && jumpLinks.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          jumpLinks.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
          });
        });
      },
      { rootMargin: "-40% 0px -45% 0px", threshold: 0 }
    );
    sections.forEach((section) => observer.observe(section));
  }
});
