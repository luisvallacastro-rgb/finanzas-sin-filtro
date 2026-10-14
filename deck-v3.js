const slides = [...document.querySelectorAll('.slide')];
const previousButton = document.querySelector('#previous-slide');
const nextButton = document.querySelector('#next-slide');
const fullscreenButton = document.querySelector('#fullscreen-toggle');
const cover = document.querySelector('.cover');
const coverHint = document.querySelector('.cover-transition-hint b');
let current = Math.max(0, Math.min(slides.length - 1, Number(location.hash.replace('#','')) - 1 || 0));
let coverStage = 0;

function resetCoverScroll() {
  if (!cover) return;
  cover.scrollTop = 0;
  cover.scrollLeft = 0;
  requestAnimationFrame(() => {
    cover.scrollTop = 0;
    cover.scrollLeft = 0;
  });
}

function resetSlideScroll(slide) {
  if (!slide) return;
  slide.scrollTop = 0;
  slide.scrollLeft = 0;
  requestAnimationFrame(() => {
    slide.scrollTop = 0;
    slide.scrollLeft = 0;
  });
}

function setCoverStage(stage) {
  coverStage = stage ? 1 : 0;
  cover?.classList.toggle('is-profile-revealed', coverStage === 1);
  cover?.querySelector('.speaker-profile')?.setAttribute('aria-hidden', String(coverStage === 0));
  if (coverHint) coverHint.textContent = coverStage === 0 ? 'Conoce al expositor' : 'Continuar al recorrido';
  if (coverStage === 0) resetCoverScroll();
  previousButton.disabled = current === 0 && coverStage === 0;
}

function showSlide(index) {
  current = Math.max(0, Math.min(slides.length - 1, index));
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  slides.forEach((slide, slideIndex) => {
    const isCurrent = slideIndex === current;
    slide.classList.toggle('is-active', isCurrent);
    slide.toggleAttribute('inert', !isCurrent);
    slide.setAttribute('aria-hidden', String(!isCurrent));
  });
  void slides[current].offsetWidth;
  resetSlideScroll(slides[current]);
  history.replaceState(null, '', `#${current + 1}`);
  if (current !== 0) setCoverStage(0);
  else if (coverStage === 0) resetCoverScroll();
  previousButton.disabled = current === 0 && coverStage === 0;
  nextButton.disabled = current === slides.length - 1;
}

function goForward() {
  if (current === 0 && coverStage === 0) { setCoverStage(1); return; }
  showSlide(current + 1);
}

function goBack() {
  if (current === 0 && coverStage === 1) { setCoverStage(0); return; }
  if (current === 1) { showSlide(0); setCoverStage(1); return; }
  showSlide(current - 1);
}

document.addEventListener('keydown', event => {
  if (event.target.closest('input, select, textarea, button, [contenteditable="true"]')) return;
  if (['ArrowRight','PageDown',' '].includes(event.key)) goForward();
  if (['ArrowLeft','PageUp'].includes(event.key)) goBack();
});
previousButton.addEventListener('click', goBack);
nextButton.addEventListener('click', goForward);
fullscreenButton.addEventListener('click', async () => {
  if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
  else await document.exitFullscreen();
});

window.addEventListener('pageshow', () => {
  if (current === 0 && coverStage === 0) resetCoverScroll();
});

// Safari móvil puede reservar el gesto cuando comienza sobre elementos con
// composición propia. Aplicamos el desplazamiento directamente a cada lámina
// editorial para que todo el lienzo funcione como superficie de arrastre.
document.querySelectorAll('.slide:not(.diagnostic-app)').forEach(slide => {
  let touchY = null;
  slide.addEventListener('touchstart', event => {
    touchY = event.touches[0]?.clientY ?? null;
  }, { passive: true, capture: true });
  slide.addEventListener('touchmove', event => {
    const nextY = event.touches[0]?.clientY;
    if (touchY === null || nextY === undefined) return;
    slide.scrollTop += touchY - nextY;
    touchY = nextY;
    if (slide.scrollHeight > slide.clientHeight) event.preventDefault();
  }, { passive: false, capture: true });
  slide.addEventListener('touchend', () => { touchY = null; }, { capture: true });
  slide.addEventListener('touchcancel', () => { touchY = null; }, { capture: true });
});

showSlide(current);
