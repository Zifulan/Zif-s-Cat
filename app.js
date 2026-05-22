// ─────────────────────────────────────────────
//  APP.JS
// ─────────────────────────────────────────────
import { reactToPet, reactHiss, reactTuna, reactYarn, reactKonami,
         enterSnoreMode, exitSnoreMode,
         detectKeyword, catEvents, getCatState } from './cat.js';
import { playUnlock, playSnore, playTuna, playYarn, playKonami } from './audio.js';

// ── DOM ──
const petHint      = document.getElementById('petHint');
const catWrap      = document.getElementById('catWrap');
const petsVal      = document.getElementById('petsVal');
const countVal     = document.getElementById('countVal');
const moodVal      = document.getElementById('moodVal');
const factText     = document.getElementById('factText');
const tagLength    = document.getElementById('tagLength');
const tagCount     = document.getElementById('tagCount');
const newFactBtn   = document.getElementById('newFactBtn');
const snoreOverlay = document.getElementById('snoreOverlay');
const snoreMsg     = document.getElementById('snoreMsg');
const achieveToast = document.getElementById('achievementToast');
const nightToggle  = document.getElementById('nightToggle');
const copyBtn      = document.getElementById('copyBtn');
const favBtn       = document.getElementById('favBtn');
const favThisBtn   = document.getElementById('favThisBtn');
const favPanel     = document.getElementById('favPanel');
const favList      = document.getElementById('favList');
const achieveBtn   = document.getElementById('achievementsBtn');
const achievePanel = document.getElementById('achievementsPanel');
const commentaryEl = document.getElementById('commentary');
const tunaBtn      = document.getElementById('tunaBtn');
const yarnBtn      = document.getElementById('yarnBtn');

// ── State ──
let petsCount    = 0;
let factCount    = 0;
let holdInterval = null;
let currentFact  = '';
let currentKeyword = null;
let favourites   = [];
let rapidPetTimer = null;
let rapidCount   = 0;
let isAnnoyed    = false;

// Hide tuna + yarn on touch devices (media query won't catch desktop-view mobile)
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
  document.getElementById('tunaBtn').style.display = 'none';
  document.getElementById('yarnBtn').style.display = 'none';
}

// ─────────────────────────────────────────────
//  PAW TRAIL CURSOR
// ─────────────────────────────────────────────
const pawCursor = document.getElementById('pawCursor');
let lastTrailX = 0, lastTrailY = 0, trailThrottle = 0;

document.addEventListener('mousemove', e => {
  pawCursor.style.left = e.clientX + 'px';
  pawCursor.style.top  = e.clientY + 'px';

  const now = Date.now();
  const dist = Math.hypot(e.clientX - lastTrailX, e.clientY - lastTrailY);
  if (dist > 38 && now - trailThrottle > 120) {
    trailThrottle = now;
    lastTrailX = e.clientX; lastTrailY = e.clientY;
    const trail = document.createElement('div');
    trail.className = 'paw-trail';
    trail.textContent = '🐾';
    trail.style.left = e.clientX + 'px';
    trail.style.top  = e.clientY + 'px';
    trail.style.transform = `translate(-50%,-50%) rotate(${Math.random()*40 - 20}deg)`;
    document.body.appendChild(trail);
    setTimeout(() => trail.remove(), 700);
  }
});

// ─────────────────────────────────────────────
//  NIGHT MODE
// ─────────────────────────────────────────────
const isNightTime = () => { const h = new Date().getHours(); return h >= 20 || h < 6; };

function applyNightMode(on) {
  document.body.classList.toggle('night', on);
  nightToggle.textContent = on ? '☀ day' : '🌙 night';
}
applyNightMode(isNightTime());
nightToggle.addEventListener('click', () => applyNightMode(!document.body.classList.contains('night')));

// ─────────────────────────────────────────────
//  CAT COMMENTARY
// ─────────────────────────────────────────────
const COMMENTS = {
  default: [
    '…so what.',
    'I already knew that.',
    'irrelevant.',
    '…could be worse.',
    'fascinating. (it is not.)',
    'I don\'t care.',
    'sure, whatever.',
    '…noted. now feed me.',
    'this changes nothing.',
    'you woke me up for THIS?',
  ],
  sleep: [
    'don\'t talk to me about sleep.',
    '…I was literally just doing that.',
    'relatable.',
    'impressive. I do this daily.',
  ],
  fish: [
    '🐟 ...excuse me?',
    'now THAT is relevant.',
    'I require this immediately.',
    'you have my full attention.',
    'finally, a worthy fact.',
  ],
  hunt: [
    'rookie numbers.',
    'I could do better.',
    'naturally.',
    '…I respect this.',
  ],
  happy: [
    '...fine. this is acceptable.',
    'don\'t get used to it.',
    'I suppose.',
    '…whatever.',
  ],
};

function showCommentary(keyword) {
  const pool = COMMENTS[keyword] || COMMENTS.default;
  const line = pool[Math.floor(Math.random() * pool.length)];
  gsap.to(commentaryEl, {
    opacity: 0, duration: 0.2,
    onComplete: () => {
      commentaryEl.textContent = `"${line}"`;
      gsap.to(commentaryEl, { opacity: 1, duration: 0.4, ease: 'power2.out' });
    }
  });
}

// ─────────────────────────────────────────────
//  MOOD
// ─────────────────────────────────────────────
const MOODS = [
  { min: 0,  emoji: '😒', label: 'grumpy'     },
  { min: 3,  emoji: '😐', label: 'tolerating'  },
  { min: 8,  emoji: '🙂', label: 'content'     },
  { min: 15, emoji: '😌', label: 'purring'     },
  { min: 25, emoji: '🥰', label: 'obsessed'    },
];
let moodDecayTimer = null;

function setMoodEmoji(mood) {
  if (moodVal.textContent === mood.emoji) return;
  gsap.to(moodVal, {
    scale: 1.6, duration: 0.15, ease: 'back.out(2)',
    onComplete: () => {
      moodVal.textContent = mood.emoji;
      moodVal.title = mood.label;
      gsap.to(moodVal, { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.5)' });
    }
  });
}

function updateMood() {
  const mood = [...MOODS].reverse().find(m => petsCount >= m.min) || MOODS[0];
  setMoodEmoji(mood);
  clearTimeout(moodDecayTimer);
  moodDecayTimer = setTimeout(() => {
    petsCount = 0;
    petsVal.textContent = 0;
    setMoodEmoji(MOODS[0]);
  }, 30000);
}

// ─────────────────────────────────────────────
//  ACHIEVEMENTS
// ─────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id: 'first_pet',  icon: '🐾', name: 'First touch',   desc: 'Petted for the first time',     check: () => petsCount >= 1   },
  { id: 'pet_10',     icon: '✋', name: '10 pets',        desc: 'Petted 10 times',               check: () => petsCount >= 10  },
  { id: 'pet_50',     icon: '🤝', name: '50 pets',        desc: 'Petted 50 times',               check: () => petsCount >= 50  },
  { id: 'facts_5',    icon: '📖', name: '5 facts',        desc: 'Read 5 facts',                  check: () => factCount >= 5   },
  { id: 'facts_10',   icon: '📚', name: 'Scholar',        desc: 'Read 10 facts',                 check: () => factCount >= 10  },
  { id: 'grumpy_pet', icon: '😤', name: 'Brave soul',     desc: 'Petted while still grumpy',     check: () => petsCount === 1 && moodVal.textContent === '😒' },
  { id: 'fish_fact',  icon: '🐟', name: 'Fish spotted',   desc: 'Got a fact mentioning fish',    check: () => currentKeyword === 'fish' },
  { id: 'night_owl',  icon: '🌙', name: 'Night owl',      desc: 'Visited after dark',            check: () => isNightTime()    },
  { id: 'obsessed',   icon: '🥰', name: 'Cat person',     desc: 'Reached obsessed mood',         check: () => petsCount >= 25  },
  { id: 'hissed',     icon: '😾', name: 'Too much!',      desc: 'Got hissed at',                 check: () => false            },
  { id: 'tuna',       icon: '🐟', name: 'Secret admirer', desc: 'Found the hidden tuna',         check: () => false            },
  { id: 'insomniac',  icon: '💤', name: 'Insomniac',      desc: 'Let cat fall into deep sleep',  check: () => false            },
  { id: 'fav_3',      icon: '⭐', name: 'Collector',      desc: 'Saved 3 favourite facts',       check: () => favourites.length >= 3 },
  { id: 'yarn',        icon: '🧶', name: 'Cat instinct',    desc: 'Found the hidden yarn',         check: () => false },
  { id: 'konami',      icon: '🕹️', name: 'Cheat code',      desc: 'Entered the Konami code',       check: () => false },
];

const unlocked = new Set();

function checkAchievements() {
  ACHIEVEMENTS.forEach(a => {
    if (!unlocked.has(a.id) && a.check()) triggerUnlock(a.id);
  });
}

function triggerUnlock(id) {
  const a = ACHIEVEMENTS.find(x => x.id === id);
  if (!a || unlocked.has(id)) return;
  unlocked.add(id);
  showAchievementToast(a);
  renderAchievements();
  playUnlock();
}

function showAchievementToast(a) {
  achieveToast.textContent = `${a.icon} ${a.name} unlocked!`;
  gsap.killTweensOf(achieveToast);
  gsap.fromTo(achieveToast,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.35, ease: 'back.out(2)',
      onComplete: () => gsap.to(achieveToast, { opacity: 0, y: -10, duration: 0.4, delay: 2.5, ease: 'power2.in' })
    }
  );
}

function renderAchievements() {
  const grid = document.getElementById('achievementGrid');
  if (!grid) return;
  grid.innerHTML = '';
  ACHIEVEMENTS.forEach(a => {
    const div = document.createElement('div');
    div.className = 'achievement' + (unlocked.has(a.id) ? ' unlocked' : '');
    div.title = a.desc;
    div.innerHTML = `<div class="achievement-icon">${unlocked.has(a.id) ? a.icon : '🔒'}</div><div class="achievement-name">${a.name}</div>`;
    grid.appendChild(div);
  });
}

achieveBtn.addEventListener('click', () => {
  achievePanel.classList.toggle('open');
  favPanel.classList.remove('open');
  achieveBtn.textContent = achievePanel.classList.contains('open') ? '✦ hide' : '✦ achievements';
  favBtn.textContent = '✦ favourites';
  renderAchievements();
});

if (isNightTime()) triggerUnlock('night_owl');

// ─────────────────────────────────────────────
//  FAVOURITES
// ─────────────────────────────────────────────
function renderFavourites() {
  favList.innerHTML = '';
  if (!favourites.length) {
    favList.innerHTML = '<div class="fav-empty">no saved facts yet ✦</div>';
    return;
  }
  favourites.forEach((fact, i) => {
    const div = document.createElement('div');
    div.className = 'fav-item';
    div.innerHTML = `${fact}<button class="fav-remove" data-i="${i}">✕ remove</button>`;
    div.querySelector('.fav-remove').addEventListener('click', () => {
      favourites.splice(i, 1);
      renderFavourites();
    });
    favList.appendChild(div);
  });
}

favBtn.addEventListener('click', () => {
  favPanel.classList.toggle('open');
  achievePanel.classList.remove('open');
  favBtn.textContent = favPanel.classList.contains('open') ? '✦ hide' : '✦ favourites';
  achieveBtn.textContent = '✦ achievements';
  renderFavourites();
});

favThisBtn.addEventListener('click', () => {
  if (!currentFact || favourites.includes(currentFact)) return;
  favourites.push(currentFact);
  favThisBtn.textContent = '⭐ saved!';
  favThisBtn.classList.add('saved');
  gsap.fromTo(favThisBtn, { scale: 1 }, { scale: 1.12, duration: 0.15, yoyo: true, repeat: 1, ease: 'back.out(2)' });
  setTimeout(() => {
    favThisBtn.textContent = '⭐ favourite';
    favThisBtn.classList.remove('saved');
  }, 2000);
  checkAchievements();
  if (favPanel.classList.contains('open')) renderFavourites();
});

// ─────────────────────────────────────────────
//  IDLE / SNORE
// ─────────────────────────────────────────────
let idleTimer = null, isSnoring = false;

function resetIdleTimer() {
  clearTimeout(idleTimer);
  if (isSnoring) exitSnore();
  idleTimer = setTimeout(enterSnore, 2 * 60 * 1000);
}

function enterSnore() {
  isSnoring = true;
  enterSnoreMode();
  snoreOverlay.classList.add('active');
  gsap.to(snoreMsg, { opacity: 1, duration: 1.2, ease: 'power2.out' });
  playSnore();
  triggerUnlock('insomniac');
}

function exitSnore() {
  isSnoring = false;
  exitSnoreMode();
  snoreOverlay.classList.remove('active');
  gsap.to(snoreMsg, { opacity: 0, duration: 0.6 });
}

snoreOverlay.addEventListener('click', exitSnore);
document.addEventListener('keydown',   resetIdleTimer);
document.addEventListener('mousemove', resetIdleTimer);
resetIdleTimer();

// ─────────────────────────────────────────────
//  RAPID PET → HISS
// ─────────────────────────────────────────────
function triggerPet() {
  if (isAnnoyed) return; // blocked during cooldown
  resetIdleTimer();
  petHint.classList.add('gone');

  // Rapid pet detection — 4 pets within 1.2s = hiss
  rapidCount++;
  clearTimeout(rapidPetTimer);
  rapidPetTimer = setTimeout(() => { rapidCount = 0; }, 1200);

  if (rapidCount >= 4) {
    rapidCount = 0;
    isAnnoyed  = true;
    clearInterval(holdInterval);
    reactHiss();
    triggerUnlock('hissed');
    // Annoyed commentary
    commentaryEl.textContent = '"ENOUGH."';
    gsap.fromTo(commentaryEl, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    // Cooldown 3s
    setTimeout(() => { isAnnoyed = false; }, 3000);
    return;
  }

  petsCount++;
  petsVal.textContent = petsCount;
  gsap.fromTo(petsVal,
    { scale: 1 },
    { scale: 1.5, color: '#9b3d1c', duration: 0.18, yoyo: true, repeat: 1, ease: 'back.out(2)' }
  );

  // Rare events (8% chance)
  const roll = Math.random();
  if (roll < 0.04) {
    reactRareEvent('sneeze');
  } else if (roll < 0.08) {
    reactRareEvent('ignore');
  } else {
    reactToPet(currentKeyword);
  }

  updateMood();
  checkAchievements();
}

// ─────────────────────────────────────────────
//  RARE EVENTS
// ─────────────────────────────────────────────
function reactRareEvent(type) {
  if (type === 'sneeze') {
    reactToPet('sneeze');
    commentaryEl.textContent = '"...achoo."';
    gsap.fromTo(commentaryEl, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    // shake the whole card
    gsap.timeline()
      .to('.card', { x: -5, duration: 0.06 })
      .to('.card', { x: 5,  duration: 0.06 })
      .to('.card', { x: -3, duration: 0.06 })
      .to('.card', { x: 0,  duration: 0.1 });
  } else if (type === 'ignore') {
    commentaryEl.textContent = '"...zzz."';
    gsap.fromTo(commentaryEl, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    // cat just doesn't react — no animation
  }
}

catWrap.addEventListener('mousedown', e => {
  e.preventDefault(); triggerPet();
  holdInterval = setInterval(triggerPet, 600);
});
catWrap.addEventListener('mouseup',    () => clearInterval(holdInterval));
catWrap.addEventListener('mouseleave', () => clearInterval(holdInterval));
catWrap.addEventListener('touchstart', e => {
  e.preventDefault(); triggerPet();
  holdInterval = setInterval(triggerPet, 600);
}, { passive: false });
catWrap.addEventListener('touchend',   () => clearInterval(holdInterval));
catWrap.addEventListener('touchcancel',() => clearInterval(holdInterval));

// ─────────────────────────────────────────────
//  HIDDEN TUNA BUTTON
// ─────────────────────────────────────────────
// Appears faintly after 5 pets, hover to see it
tunaBtn.addEventListener('click', () => {
  reactTuna();
  playTuna();
  commentaryEl.textContent = '"...fine. I accept this offering."';
  gsap.fromTo(commentaryEl, { opacity: 0 }, { opacity: 1, duration: 0.4 });
  triggerUnlock('tuna');
  // Burst of fish
  for (let i = 0; i < 6; i++) {
    spawnBurst(
      catWrap.getBoundingClientRect().left + catWrap.offsetWidth / 2 + (Math.random()-0.5)*80,
      catWrap.getBoundingClientRect().top  + catWrap.offsetHeight / 2 + (Math.random()-0.5)*60,
      '🐟'
    );
  }
});

// ─────────────────────────────────────────────
//  YARN BUTTON
// ─────────────────────────────────────────────
yarnBtn.addEventListener('click', () => {
  reactYarn();
  playYarn();
  commentaryEl.textContent = '"...I suppose this is acceptable."';
  gsap.fromTo(commentaryEl, { opacity: 0 }, { opacity: 1, duration: 0.4 });
  triggerUnlock('yarn');
  // Yarn burst
  for (let i = 0; i < 5; i++) {
    spawnBurst(
      catWrap.getBoundingClientRect().left + catWrap.offsetWidth / 2 + (Math.random()-0.5)*70,
      catWrap.getBoundingClientRect().top  + catWrap.offsetHeight / 2 + (Math.random()-0.5)*50,
      '🧶'
    );
  }
});

// ─────────────────────────────────────────────
//  KONAMI CODE  ↑↑↓↓←→←→BA
// ─────────────────────────────────────────────
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let konamiIdx = 0;

document.addEventListener('keydown', e => {
  if (e.key === KONAMI[konamiIdx]) {
    konamiIdx++;
    if (konamiIdx === KONAMI.length) {
      konamiIdx = 0;
      reactKonami();
      playKonami();
      commentaryEl.textContent = '"...how did you know that."';
      gsap.fromTo(commentaryEl, { opacity: 0 }, { opacity: 1, duration: 0.4 });
      triggerUnlock('konami');
      // Big burst all over screen
      for (let i = 0; i < 12; i++) {
        setTimeout(() => spawnBurst(
          Math.random() * window.innerWidth,
          Math.random() * window.innerHeight,
          ['⭐','✨','🌟','💫'][Math.floor(Math.random()*4)]
        ), i * 80);
      }
    }
  } else {
    konamiIdx = e.key === KONAMI[0] ? 1 : 0;
  }
});

// Triple tap header for mobile Konami
let headerTapCount = 0;
let headerTapTimer = null;
document.querySelector('.header-title').addEventListener('click', () => {
  headerTapCount++;
  clearTimeout(headerTapTimer);
  headerTapTimer = setTimeout(() => { headerTapCount = 0; }, 600);
  if (headerTapCount >= 3) {
    headerTapCount = 0;
    reactKonami();
    playKonami();
    commentaryEl.textContent = '"...how did you know that."';
    gsap.fromTo(commentaryEl, { opacity: 0 }, { opacity: 1, duration: 0.4 });
    triggerUnlock('konami');
    for (let i = 0; i < 12; i++) {
      setTimeout(() => spawnBurst(
        Math.random() * window.innerWidth,
        Math.random() * window.innerHeight,
        ['⭐','✨','🌟','💫'][Math.floor(Math.random()*4)]
      ), i * 80);
    }
  }
});

// ─────────────────────────────────────────────
//  COPY FACT
// ─────────────────────────────────────────────
copyBtn.addEventListener('click', () => {
  if (!currentFact) return;
  navigator.clipboard.writeText(currentFact).then(() => {
    copyBtn.textContent = '✦ copied!';
    copyBtn.classList.add('copied');
    gsap.fromTo(copyBtn, { scale: 1 }, { scale: 1.1, duration: 0.15, yoyo: true, repeat: 1, ease: 'back.out(2)' });
    setTimeout(() => { copyBtn.textContent = '✦ copy'; copyBtn.classList.remove('copied'); }, 2000);
  });
});

// ─────────────────────────────────────────────
//  KEYWORD HIGHLIGHT
// ─────────────────────────────────────────────
function highlightKeywords(text, keyword) {
  if (!keyword) return text;
  const words = {
    sleep: ['sleep','nap','doze','rest','dream','snore','slumber'],
    fish:  ['fish','tuna','salmon','sardine','seafood','prey'],
    hunt:  ['hunt','stalk','chase','pounce','predator','catch','kill'],
    happy: ['play','purr','love','friend','bond','social','affection'],
  }[keyword] || [];
  let result = text;
  words.forEach(w => {
    const re = new RegExp(`\\b(${w}s?)\\b`, 'gi');
    result = result.replace(re, `<span class="fact-keyword">$1</span>`);
  });
  return result;
}

// ─────────────────────────────────────────────
//  FETCH FACT
// ─────────────────────────────────────────────
async function fetchFact() {
  resetIdleTimer();
  newFactBtn.disabled = true;
  newFactBtn.classList.add('fetching');
  factText.classList.remove('revealed');
  factText.classList.add('loading');

  try {
    const res  = await fetch('https://catfact.ninja/fact');
    const data = await res.json();
    await new Promise(r => setTimeout(r, 240));

    currentFact    = data.fact;
    currentKeyword = detectKeyword(data.fact);

    factText.classList.remove('loading');
    factText.innerHTML = highlightKeywords(data.fact, currentKeyword);
    factText.classList.add('revealed');

    // Smoothly animate bubble to new content height
    const bubble = document.querySelector('.bubble');
    const newH   = Math.max(110, factText.scrollHeight + 44);
    gsap.to(bubble, { minHeight: newH, duration: 0.4, ease: 'power2.inOut' });

    factCount++;
    tagLength.textContent = `${data.length} chars`;
    tagCount.textContent  = `#${factCount}`;
    countVal.textContent  = factCount;

    // Reset fav button
    favThisBtn.textContent = '⭐ favourite';
    favThisBtn.classList.remove('saved');

    // Commentary from cat
    setTimeout(() => showCommentary(currentKeyword), 600);

    checkAchievements();

    // Cat reacts to keyword while sleeping
    if (currentKeyword && getCatState() === 'sleeping') {
      setTimeout(() => reactToPet(currentKeyword), 900);
    }

    // Reveal tuna + yarn buttons after 5 pets or fish fact
    if (petsCount >= 5 || currentKeyword === 'fish') {
      tunaBtn.classList.add('visible');
      yarnBtn.classList.add('visible');
    }

  } catch {
    factText.classList.remove('loading');
    factText.textContent = 'The cat is too asleep to fetch facts. Try again 😴';
    factText.classList.add('revealed');
  } finally {
    newFactBtn.disabled = false;
    newFactBtn.classList.remove('fetching');
  }
}

newFactBtn.addEventListener('click', fetchFact);

// ─────────────────────────────────────────────
//  BACKGROUND DOODLES + CLICK BURST
// ─────────────────────────────────────────────
const doodles = ['✦','✧','♡','♥','✿','❀','~','z'];
const dc = document.getElementById('doodleContainer');
for (let i = 0; i < 14; i++) {
  const el = document.createElement('div');
  el.className = 'doodle';
  el.textContent = doodles[Math.floor(Math.random() * doodles.length)];
  el.style.left = Math.random() * 100 + 'vw';
  el.style.top  = (20 + Math.random() * 70) + 'vh';
  el.style.fontSize = (11 + Math.random() * 14) + 'px';
  el.style.color = Math.random() > 0.5 ? 'var(--amber)' : 'var(--muted)';
  const dur = 7 + Math.random() * 10;
  el.style.animationDuration = dur + 's';
  el.style.animationDelay   = -(Math.random() * dur) + 's';
  dc.appendChild(el);
}

function spawnBurst(x, y, sym) {
  const syms = sym ? [sym] : ['✦','✧','♡','♥','✿','~'];
  const b = document.createElement('div');
  b.className   = 'burst';
  b.textContent = syms[Math.floor(Math.random() * syms.length)];
  b.style.left  = x + 'px';
  b.style.top   = y + 'px';
  b.style.color = sym ? 'var(--amber)' : (Math.random() > 0.5 ? 'var(--amber)' : 'var(--rust)');
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 700);
}

document.addEventListener('click', e => {
  if (e.target.closest('#catWrap') || e.target.closest('button')) return;
  resetIdleTimer();
  spawnBurst(e.clientX, e.clientY);
});

// ─────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────
catEvents.addEventListener('ready', () => fetchFact());
renderAchievements();
renderFavourites();