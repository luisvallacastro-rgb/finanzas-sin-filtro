const slides = [...document.querySelectorAll('.slide')];
const previousButton = document.querySelector('#previous-slide');
const nextButton = document.querySelector('#next-slide');
const fullscreenButton = document.querySelector('#fullscreen-toggle');
let current = Math.max(0, Math.min(slides.length - 1, Number(location.hash.replace('#','')) - 1 || 0));

function showSlide(index) {
  current = Math.max(0, Math.min(slides.length - 1, index));
  slides.forEach(slide => slide.classList.remove('is-active'));
  void slides[current].offsetWidth;
  slides[current].classList.add('is-active');
  history.replaceState(null, '', `#${current + 1}`);
  previousButton.disabled = current === 0;
  nextButton.disabled = current === slides.length - 1;
}

document.addEventListener('keydown', event => {
  if (event.target.closest('input, select, textarea, button, [contenteditable="true"]')) return;
  if (['ArrowRight','PageDown',' '].includes(event.key)) showSlide(current + 1);
  if (['ArrowLeft','PageUp'].includes(event.key)) showSlide(current - 1);
});
previousButton.addEventListener('click', () => showSlide(current - 1));
nextButton.addEventListener('click', () => showSlide(current + 1));
fullscreenButton.addEventListener('click', async () => {
  if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
  else await document.exitFullscreen();
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
