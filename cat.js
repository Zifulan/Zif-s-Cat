// ─────────────────────────────────────────────
//  CAT.JS — Lottie + GSAP cat animations
// ─────────────────────────────────────────────
import { playPurr, playMeow, playHiss, startLofiHum, stopLofiHum } from './audio.js';

const SLEEP_START = 0;
const SLEEP_END   = 180;
const WAKE_START  = 180;
const WAKE_END    = 480;

const lottieEl   = document.getElementById('lottieContainer');
const purrLabel  = document.getElementById('purrLabel');
const sleepLabel = document.getElementById('sleepLabel');
const stateBadge = document.getElementById('stateBadge');
const catWrap    = document.getElementById('catWrap');

const anim = lottie.loadAnimation({
  container: lottieEl,
  renderer:  'svg',
  loop:      false,
  autoplay:  false,
  path:      'cat.json',
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid meet',
    clearCanvas:         true,
    progressiveLoad:     false,
    hideOnTransparent:   true,
  }
});

let catState    = 'sleeping';
let isLoaded    = false;
let settleTimer = null;

// ─────────────────────────────────────────────
//  ZZZ
// ─────────────────────────────────────────────
function startZzzLoop() {
  gsap.killTweensOf(sleepLabel);
  gsap.getById('zzz')?.kill();
  const tl = gsap.timeline({ repeat: -1, id: 'zzz', delay: 0.4 });
  tl.fromTo(sleepLabel,
    { y: 0, opacity: 0, scale: 0.7 },
    { y: -22, opacity: 0.65, scale: 1, duration: 1.6, ease: 'power1.out' }
  ).to(sleepLabel, { opacity: 0, duration: 0.5, ease: 'power1.in' }, '-=0.4');
}
function stopZzzLoop() {
  gsap.getById('zzz')?.kill();
  gsap.to(sleepLabel, { opacity: 0, duration: 0.2 });
}

// ─────────────────────────────────────────────
//  DREAM BUBBLES — float above while sleeping
// ─────────────────────────────────────────────
const DREAM_SYMBOLS = ['🐟','🐦','🧶','🐭','⭐','🦋','🐾','🍖'];
let dreamInterval = null;

function startDreamBubbles() {
  stopDreamBubbles();
  // First bubble after a short delay
  dreamInterval = setInterval(spawnDreamBubble, 2800);
  setTimeout(spawnDreamBubble, 900);
}

function stopDreamBubbles() {
  clearInterval(dreamInterval);
  dreamInterval = null;
  // Remove any existing bubbles
  document.querySelectorAll('.dream-bubble').forEach(el => {
    gsap.to(el, { opacity: 0, scale: 0.5, duration: 0.3, onComplete: () => el.remove() });
  });
}

function spawnDreamBubble() {
  if (catState !== 'sleeping') return;
  const sym = DREAM_SYMBOLS[Math.floor(Math.random() * DREAM_SYMBOLS.length)];
  const el  = document.createElement('div');
  el.className   = 'dream-bubble';
  el.textContent = sym;

  // Position above cat, slight random X offset
  const xOff = (Math.random() - 0.5) * 80;
  el.style.cssText = `
    position: absolute;
    top: -10px;
    left: calc(50% + ${xOff}px);
    transform: translate(-50%, 0);
    font-size: ${13 + Math.random() * 8}px;
    opacity: 0;
    pointer-events: none;
    z-index: 15;
    filter: drop-shadow(0 1px 3px rgba(0,0,0,0.15));
  `;
  catWrap.appendChild(el);

  // Animate: fade in, float up, fade out
  gsap.fromTo(el,
    { opacity: 0, y: 0, scale: 0.4 },
    {
      opacity: 0.85, y: -70 - Math.random() * 40, scale: 1,
      duration: 1.2, ease: 'power1.out',
      onComplete: () => {
        gsap.to(el, {
          opacity: 0, y: `-=${20 + Math.random() * 15}`, scale: 0.7,
          duration: 1.0, ease: 'power1.in',
          onComplete: () => el.remove()
        });
      }
    }
  );
}

// ─────────────────────────────────────────────
//  EYE TRACKING — follows cursor when awake
// ─────────────────────────────────────────────
let eyeTrackingActive = false;
let eyeEl = null; // the SVG eyes group, found after Lottie loads

function startEyeTracking() {
  eyeTrackingActive = true;
}
function stopEyeTracking() {
  eyeTrackingActive = false;
  // Reset eye positions
  if (eyeEl) gsap.to(eyeEl, { x: 0, y: 0, duration: 0.4, ease: 'power2.out' });
}

document.addEventListener('mousemove', e => {
  if (!eyeTrackingActive || !isLoaded) return;

  // Get cat center position
  const rect   = catWrap.getBoundingClientRect();
  const catCX  = rect.left + rect.width  / 2;
  const catCY  = rect.top  + rect.height / 2;

  // Vector from cat to cursor, normalized
  const dx  = e.clientX - catCX;
  const dy  = e.clientY - catCY;
  const len = Math.hypot(dx, dy) || 1;

  // Max pupil travel (pixels in SVG space, clamped)
  const maxTravel = 4;
  const tx = (dx / len) * Math.min(len / 40, maxTravel);
  const ty = (dy / len) * Math.min(len / 40, maxTravel);

  // Find the SVG eye elements by class after Lottie renders
  if (!eyeEl) {
    // Lottie renders SVG layers — find the face/mat layer SVG group
    eyeEl = lottieEl.querySelector('svg');
  }

  // We animate the whole lottie SVG subtly — just a tiny lean toward cursor
  // (full per-eye manipulation requires Lottie internals; this gives a great effect)
  gsap.to(lottieEl, {
    x: tx * 1.5,
    y: ty * 0.8,
    duration: 0.3,
    ease: 'power2.out',
    overwrite: 'auto',
  });
});

// ─────────────────────────────────────────────
//  SLEEP LOOP
// ─────────────────────────────────────────────
export function playSleepLoop() {
  catState = 'sleeping';
  stateBadge.textContent = 'sleeping…';
  cancelSettle();
  anim.setSpeed(1);
  anim.loop = true;
  anim.playSegments([SLEEP_START, SLEEP_END], true);
  startZzzLoop();
  startDreamBubbles();
  startLofiHum();
  stopEyeTracking();
  gsap.to(purrLabel, { opacity: 0, y: -4, duration: 0.5, ease: 'power2.in' });
  // Reset any eye tracking position drift
  gsap.to(lottieEl, { x: 0, y: 0, duration: 0.6, ease: 'power2.out' });
}

// ─────────────────────────────────────────────
//  WAKE SEQUENCE
// ─────────────────────────────────────────────
function playWakeSequence() {
  catState = 'waking';
  stateBadge.textContent = 'being petted!';
  stopZzzLoop();
  stopDreamBubbles();
  stopLofiHum();
  startEyeTracking();
  cancelSettle();
  anim.loop = false;
  anim.setSpeed(1.4);
  anim.playSegments([WAKE_START, WAKE_END], true);
}

// ─────────────────────────────────────────────
//  DROWSY SETTLE
// ─────────────────────────────────────────────
function beginDrowsySettle() {
  if (catState !== 'waking') return;
  catState = 'settling';
  stateBadge.textContent = 'settling…';
  gsap.to(purrLabel, { opacity: 0, duration: 1.2, ease: 'power1.in' });
  anim.loop = false;
  anim.setSpeed(0.5);
  anim.goToAndPlay(WAKE_END - 55, true);
  gsap.to(lottieEl, { scaleX: 1, scaleY: 1, rotation: 0, x: 0, y: 0, transformOrigin: '50% 85%', duration: 1.4, ease: 'power2.out' });
  settleTimer = setTimeout(() => {
    if (catState === 'settling') {
      gsap.to(lottieEl, {
        opacity: 0.55, duration: 0.3, ease: 'power1.in',
        onComplete: () => {
          playSleepLoop();
          gsap.to(lottieEl, { opacity: 1, duration: 0.6, ease: 'power1.out' });
        }
      });
    }
  }, 1800);
}

function cancelSettle() { clearTimeout(settleTimer); }

anim.addEventListener('complete', () => { if (catState === 'waking') beginDrowsySettle(); });
anim.addEventListener('DOMLoaded', () => {
  isLoaded = true;
  playSleepLoop();
  catEvents.dispatchEvent(new Event('ready'));
});

// ─────────────────────────────────────────────
//  KEYWORD DETECTION
// ─────────────────────────────────────────────
const KEYWORD_SETS = {
  sleep: ['sleep','nap','doze','rest','dream','snore','slumber'],
  fish:  ['fish','tuna','salmon','sardine','seafood','prey'],
  hunt:  ['hunt','stalk','chase','pounce','predator','catch','kill'],
  happy: ['play','purr','love','friend','bond','social','affection'],
};
export function detectKeyword(text) {
  const lower = text.toLowerCase();
  for (const [key, words] of Object.entries(KEYWORD_SETS)) {
    if (words.some(w => lower.includes(w))) return key;
  }
  return null;
}

// ─────────────────────────────────────────────
//  HEARTS
// ─────────────────────────────────────────────
const heartSets = {
  default: ['♡','♥','✦','✿','~','z','✧'],
  sleep:   ['z','Z','💤','~'],
  fish:    ['🐟','~','✦','♡'],
  hunt:    ['💢','✦','~','⚡'],
  happy:   ['♥','♡','✿','🌸'],
  tuna:    ['🐟','🐠','🐡','✦'],
  yarn:    ['🧶','✦','~','🌀','♡'],
  sneeze:  ['✨','~','💨','✦'],
  hiss:    ['💢','⚡','~','✦'],
  konami:  ['⭐','🌟','✨','🎉','💫'],
};

function spawnHearts(keyword = null) {
  const pool = heartSets[keyword] || heartSets.default;
  const n = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div');
    el.className = 'heart-particle';
    el.textContent = pool[Math.floor(Math.random() * pool.length)];
    el.style.fontSize = (12 + Math.random() * 11) + 'px';
    el.style.color = Math.random() > 0.5 ? '#9b3d1c' : '#c8922a';
    catWrap.appendChild(el);
    const tx = (Math.random() - 0.5) * 140;
    const ty = -(50 + Math.random() * 70);
    gsap.fromTo(el,
      { x: (Math.random()-0.5)*20, y: 0, opacity: 0, scale: 0.3, rotation: (Math.random()-0.5)*30 },
      {
        x: tx, y: ty, opacity: 1, scale: 1 + Math.random()*0.5,
        rotation: (Math.random()-0.5)*50,
        duration: 0.38, delay: i * 0.07, ease: 'back.out(2)',
        onComplete() {
          gsap.to(el, {
            y: ty - 30, opacity: 0, scale: 0.5, duration: 0.5, ease: 'power2.in',
            onComplete: () => el.remove()
          });
        }
      }
    );
  }
}

// ─────────────────────────────────────────────
//  REACTIONS
// ─────────────────────────────────────────────
export function reactToPet(keyword = null) {
  if (!isLoaded) return;
  const labels = {
    sleep: 'zzzz… 💤', fish: 'ooh fish! 🐟',
    hunt: 'grr… 🐾',   happy: 'purrrr~ ♡', default: '…z z z ♡'
  };
  purrLabel.textContent = labels[keyword] || labels.default;
  cancelSettle();
  playWakeSequence();

  gsap.killTweensOf(lottieEl, 'scaleX,scaleY');
  gsap.timeline()
    .to(lottieEl, { scaleX: 1.13, scaleY: 0.87, transformOrigin: '50% 85%', duration: 0.08, ease: 'power4.in' })
    .to(lottieEl, { scaleX: 0.95, scaleY: 1.08, duration: 0.14, ease: 'power2.out' })
    .to(lottieEl, { scaleX: 1,    scaleY: 1,    duration: 0.7,  ease: 'elastic.out(0.9, 0.45)' });

  gsap.killTweensOf(lottieEl, 'rotation');
  const tiltAmt = keyword === 'hunt' ? 8 : 5;
  gsap.timeline()
    .to(lottieEl, { rotation: -tiltAmt, transformOrigin: '50% 85%', duration: 0.08, ease: 'power4.out' })
    .to(lottieEl, { rotation: tiltAmt * 0.6, duration: 0.13, ease: 'power2.inOut' })
    .to(lottieEl, { rotation: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });

  gsap.killTweensOf(purrLabel);
  gsap.fromTo(purrLabel,
    { opacity: 0, y: 10, scale: 0.8 },
    { opacity: 1, y: 0,  scale: 1, duration: 0.25, ease: 'back.out(2.5)' }
  );

  if (keyword === 'fish' || keyword === 'happy') playMeow();
  else playPurr();
  spawnHearts(keyword);
}

export function reactHiss() {
  if (!isLoaded) return;
  stateBadge.textContent = 'ANNOYED!';
  purrLabel.textContent  = 'hssss! 😾';
  gsap.killTweensOf(purrLabel);
  gsap.fromTo(purrLabel,
    { opacity: 0, scale: 0.8 },
    { opacity: 1, scale: 1.1, duration: 0.2, ease: 'back.out(3)' }
  );
  const catWrapEl = document.getElementById('catWrap');
  catWrapEl.classList.remove('hissing');
  void catWrapEl.offsetWidth;
  catWrapEl.classList.add('hissing');
  setTimeout(() => catWrapEl.classList.remove('hissing'), 500);

  gsap.killTweensOf(lottieEl);
  gsap.timeline()
    .to(lottieEl, { scaleX: 1.2, scaleY: 0.8, duration: 0.07, ease: 'power4.in' })
    .to(lottieEl, { scaleX: 0.9, scaleY: 1.15, duration: 0.1, ease: 'power2.out' })
    .to(lottieEl, { scaleX: 1,   scaleY: 1,    duration: 0.8, ease: 'elastic.out(1, 0.35)' });

  playHiss();
  spawnHearts('hiss');
  gsap.to(lottieEl, { filter: 'hue-rotate(160deg) saturate(2)', duration: 0.1,
    onComplete: () => gsap.to(lottieEl, { filter: 'none', duration: 0.6 }) });
  setTimeout(() => {
    stateBadge.textContent = 'sleeping…';
    gsap.to(purrLabel, { opacity: 0, duration: 0.5 });
  }, 2500);
}

export function reactTuna() {
  if (!isLoaded) return;
  purrLabel.textContent = 'FISH! 🐟🐟🐟';
  cancelSettle(); playWakeSequence();
  gsap.killTweensOf(lottieEl);
  gsap.timeline()
    .to(lottieEl, { scaleX: 1.18, scaleY: 0.82, duration: 0.08, ease: 'power4.in', transformOrigin: '50% 85%' })
    .to(lottieEl, { scaleX: 0.9,  scaleY: 1.14, duration: 0.14, ease: 'power2.out' })
    .to(lottieEl, { scaleX: 1,    scaleY: 1,    duration: 0.9,  ease: 'elastic.out(1.2, 0.4)' });
  gsap.killTweensOf(purrLabel);
  gsap.fromTo(purrLabel,
    { opacity: 0, y: 14, scale: 0.7 },
    { opacity: 1, y: 0,  scale: 1.15, duration: 0.3, ease: 'back.out(3)' }
  );
  for (let i = 0; i < 3; i++) setTimeout(() => spawnHearts('tuna'), i * 200);
}

export function reactYarn() {
  if (!isLoaded) return;
  purrLabel.textContent = 'ooh yarn! 🧶';
  cancelSettle(); playWakeSequence();

  // Playful bounce — more bouncy than tuna, less intense
  gsap.killTweensOf(lottieEl);
  gsap.timeline()
    .to(lottieEl, { y: -18, scaleX: 0.92, scaleY: 1.1, transformOrigin: '50% 85%', duration: 0.18, ease: 'power3.out' })
    .to(lottieEl, { y:   8, scaleX: 1.08, scaleY: 0.93, duration: 0.14, ease: 'power2.in' })
    .to(lottieEl, { y:  -6, scaleX: 0.96, scaleY: 1.04, duration: 0.1,  ease: 'power2.out' })
    .to(lottieEl, { y:   0, scaleX: 1,    scaleY: 1,    duration: 0.6,  ease: 'elastic.out(1, 0.4)' });

  gsap.killTweensOf(purrLabel);
  gsap.fromTo(purrLabel,
    { opacity: 0, y: 12, scale: 0.75, rotation: -8 },
    { opacity: 1, y: 0,  scale: 1,    rotation: 0, duration: 0.3, ease: 'back.out(3)' }
  );

  for (let i = 0; i < 2; i++) setTimeout(() => spawnHearts('yarn'), i * 180);
}

export function reactKonami() {
  if (!isLoaded) return;
  purrLabel.textContent = '✨ !!! ✨';
  cancelSettle();
  stateBadge.textContent = '★ KONAMI ★';

  // Rapid spin + grow + shrink
  gsap.killTweensOf(lottieEl);
  gsap.timeline()
    .to(lottieEl, { rotation: 360, scale: 1.35, transformOrigin: '50% 50%', duration: 0.5, ease: 'power2.inOut' })
    .to(lottieEl, { rotation: 720, scale: 0.85, duration: 0.3, ease: 'power2.in' })
    .to(lottieEl, { rotation: 720, scale: 1, duration: 0.7, ease: 'elastic.out(1.2, 0.4)' });

  // Flash rainbow filter
  const filters = ['hue-rotate(0deg)', 'hue-rotate(60deg)', 'hue-rotate(120deg)',
                    'hue-rotate(180deg)', 'hue-rotate(240deg)', 'hue-rotate(300deg)', 'none'];
  filters.forEach((f, i) => setTimeout(() => { lottieEl.style.filter = f; }, i * 100));

  gsap.killTweensOf(purrLabel);
  gsap.fromTo(purrLabel,
    { opacity: 0, scale: 0.5, rotation: -15 },
    { opacity: 1, scale: 1.3, rotation: 0, duration: 0.35, ease: 'back.out(3)' }
  );

  // Massive heart shower
  for (let i = 0; i < 5; i++) setTimeout(() => spawnHearts('konami'), i * 120);

  setTimeout(() => {
    stateBadge.textContent = 'being petted!';
    gsap.to(purrLabel, { opacity: 0, duration: 0.8, delay: 1.5 });
    playWakeSequence();
  }, 800);
}

export function enterSnoreMode() {
  stateBadge.textContent = 'deeply asleep…';
  anim.setSpeed(0.6);
}
export function exitSnoreMode() {
  if (catState === 'sleeping') anim.setSpeed(1);
  stateBadge.textContent = 'sleeping…';
}

export const catEvents = new EventTarget();
export function getCatState() { return catState; }