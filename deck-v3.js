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

// En móvil el desplazamiento es nativo. En la vista previa de escritorio
// también permitimos arrastrar la agenda con el mouse para probarla.
const strategySlide = document.querySelector('.strategy');
const strategyJourney = document.querySelector('.strategy .journey');
if (strategySlide && strategyJourney) {
  let mouseY = null;
  strategyJourney.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    mouseY = event.clientY;
    strategyJourney.setPointerCapture?.(event.pointerId);
  });
  strategyJourney.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || mouseY === null) return;
    strategySlide.scrollTop += mouseY - event.clientY;
    mouseY = event.clientY;
  });
  const finishMouseDrag = event => {
    if (mouseY === null) return;
    strategyJourney.releasePointerCapture?.(event.pointerId);
    mouseY = null;
  };
  strategyJourney.addEventListener('pointerup', finishMouseDrag);
  strategyJourney.addEventListener('pointercancel', finishMouseDrag);
}

showSlide(current);
