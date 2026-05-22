// ─────────────────────────────────────────────
//  AUDIO.JS — Web Audio API synth
// ─────────────────────────────────────────────
let audioCtx = null;
const getCtx = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
};

export function playPurr() {
  try {
    const ctx = getCtx(), t = ctx.currentTime, dur = 0.55;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    const lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, t);
    osc.frequency.linearRampToValueAtTime(52, t + dur);
    lfo.frequency.value = 28; lfoGain.gain.value = 4;
    lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
    filter.type = 'lowpass'; filter.frequency.value = 280;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.06);
    gain.gain.setValueAtTime(0.12, t + dur - 0.1);
    gain.gain.linearRampToValueAtTime(0, t + dur);
    osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    lfo.start(t); osc.start(t); lfo.stop(t + dur); osc.stop(t + dur);
  } catch(e) {}
}

export function playMeow() {
  try {
    const ctx = getCtx(), t = ctx.currentTime, dur = 0.38;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    const lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.linearRampToValueAtTime(560, t + 0.1);
    osc.frequency.linearRampToValueAtTime(320, t + dur);
    lfo.frequency.value = 6; lfoGain.gain.value = 18;
    lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.05);
    gain.gain.setValueAtTime(0.18, t + dur - 0.08);
    gain.gain.linearRampToValueAtTime(0, t + dur);
    osc.connect(gain); gain.connect(ctx.destination);
    lfo.start(t); osc.start(t); lfo.stop(t + dur); osc.stop(t + dur);
  } catch(e) {}
}

export function playHiss() {
  try {
    const ctx = getCtx(), t = ctx.currentTime, dur = 0.5;
    // White noise burst for hiss
    const bufSize = ctx.sampleRate * dur;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 3500; filter.Q.value = 0.8;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.04);
    gain.gain.linearRampToValueAtTime(0, t + dur);
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    src.start(t); src.stop(t + dur);
  } catch(e) {}
}

export function playTuna() {
  try {
    const ctx = getCtx();
    // Excited ascending notes
    [440, 554, 659, 880].forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.08;
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'triangle'; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
      gain.gain.linearRampToValueAtTime(0, t + 0.18);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.2);
    });
  } catch(e) {}
}

export function playSnore() {
  try {
    const ctx = getCtx(), t = ctx.currentTime, dur = 1.2;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(40, t);
    osc.frequency.linearRampToValueAtTime(36, t + dur * 0.5);
    osc.frequency.linearRampToValueAtTime(40, t + dur);
    filter.type = 'lowpass'; filter.frequency.value = 180;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.07, t + 0.3);
    gain.gain.setValueAtTime(0.07, t + dur - 0.3);
    gain.gain.linearRampToValueAtTime(0, t + dur);
    osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + dur);
  } catch(e) {}
}

export function playUnlock() {
  try {
    const ctx = getCtx();
    [523, 659, 784, 1047].forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.1;
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.14, t + 0.02);
      gain.gain.linearRampToValueAtTime(0, t + 0.22);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.25);
    });
  } catch(e) {}
}

// ─────────────────────────────────────────────
//  LOFI HUM — gentle drone while cat sleeps
// ─────────────────────────────────────────────
let lofiNodes = null;

export function startLofiHum() {
  try {
    if (lofiNodes) return;
    const ctx    = getCtx();
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.055, ctx.currentTime + 2.5);
    master.connect(ctx.destination);

    // Two detuned oscillators for warmth
    const freqs = [130.81, 130.81 * 1.004]; // C3 slightly detuned
    const oscs  = freqs.map(freq => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.value = 0.5;
      o.connect(g); g.connect(master);
      o.start();
      return o;
    });

    // Slow wobble LFO on gain for breathing feel
    const lfo     = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.18; lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain); lfoGain.connect(master.gain);
    lfo.start();

    // Soft high shelf cut for warmth
    const filter = ctx.createBiquadFilter();
    filter.type = 'highshelf'; filter.frequency.value = 1200; filter.gain.value = -14;

    lofiNodes = { oscs, lfo, master, ctx };
  } catch(e) {}
}

export function stopLofiHum() {
  try {
    if (!lofiNodes) return;
    const { oscs, lfo, master, ctx } = lofiNodes;
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
    setTimeout(() => {
      oscs.forEach(o => { try { o.stop(); } catch(e) {} });
      try { lfo.stop(); } catch(e) {}
      lofiNodes = null;
    }, 1600);
  } catch(e) {}
}

// ─────────────────────────────────────────────
//  YARN SOUND — playful boing
// ─────────────────────────────────────────────
export function playYarn() {
  try {
    const ctx = getCtx();
    // Bouncy descending pitch
    [660, 550, 440, 380].forEach((freq, i) => {
      const t   = ctx.currentTime + i * 0.07;
      const osc = ctx.createOscillator();
      const gain= ctx.createGain();
      osc.type  = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.linearRampToValueAtTime(freq * 0.85, t + 0.12);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.01);
      gain.gain.linearRampToValueAtTime(0, t + 0.18);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.2);
    });
  } catch(e) {}
}

// ─────────────────────────────────────────────
//  KONAMI SOUND — dramatic fanfare
// ─────────────────────────────────────────────
export function playKonami() {
  try {
    const ctx = getCtx();
    const notes = [
      { f: 523, t: 0,    d: 0.15 },
      { f: 523, t: 0.16, d: 0.15 },
      { f: 784, t: 0.32, d: 0.3  },
      { f: 659, t: 0.65, d: 0.15 },
      { f: 784, t: 0.82, d: 0.5  },
    ];
    notes.forEach(({ f, t, d }) => {
      const base = ctx.currentTime;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square'; osc.frequency.value = f;
      gain.gain.setValueAtTime(0, base + t);
      gain.gain.linearRampToValueAtTime(0.15, base + t + 0.02);
      gain.gain.linearRampToValueAtTime(0, base + t + d);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(base + t); osc.stop(base + t + d + 0.05);
    });
  } catch(e) {}
}