const revealItems = document.querySelectorAll(".reveal");
const toast = document.querySelector(".toast");
const hero = document.querySelector(".hero");
const manTrack = document.querySelector(".hero__man-track");
const heroVisual = document.querySelector(".hero__visual");
const heroFade = document.querySelector(".hero__fade");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealItems.forEach((item) => observer.observe(item));

if (hero && !reduceMotion.matches) {
  let ticking = false;

  const updateHeroMotion = () => {
    const heroRect = hero.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -heroRect.top / heroRect.height));

    if (manTrack) {
      const manShift = progress * 88;
      manTrack.style.setProperty("--man-scroll-x", `${manShift.toFixed(1)}px`);
    }

    if (heroVisual) {
      const parallaxShift = progress * 62;
      heroVisual.style.setProperty("--hero-parallax-y", `${parallaxShift.toFixed(1)}px`);
    }

    if (heroFade) {
      const fadeOpacity = 0.08 + progress * 0.92;
      heroFade.style.setProperty("--hero-fade-opacity", fadeOpacity.toFixed(3));
    }

    ticking = false;
  };

  const requestHeroUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateHeroMotion);
  };

  updateHeroMotion();
  window.addEventListener("scroll", requestHeroUpdate, { passive: true });
  window.addEventListener("resize", requestHeroUpdate);
}

document.querySelectorAll("[data-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    form.reset();
    toast.classList.add("is-visible");
    window.setTimeout(() => toast.classList.remove("is-visible"), 3500);
  });
});
