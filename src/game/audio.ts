let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let crowdGain: GainNode | null = null;
let started = false;

function context() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);
  }
  return ctx;
}

export function unlockAudio() {
  const ac = context();
  if (!ac || !master) return;
  if (ac.state === "suspended") void ac.resume();
  if (!started) {
    started = true;
    startCrowd();
  }
}

export function resumeAudio() {
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

export function setMuted(muted: boolean) {
  if (!master) return;
  master.gain.value = muted ? 0 : 1;
}

function burst(freq: number, dur: number, type: OscillatorType, peak: number, slideTo?: number) {
  const ac = context();
  if (!ac || !master) return;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(dur: number, peak: number, freq: number) {
  const ac = context();
  if (!ac || !master) return;
  const length = Math.floor(ac.sampleRate * dur);
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = 0.7;
  const gain = ac.createGain();
  const t = ac.currentTime;
  gain.gain.setValueAtTime(peak, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start(t);
  src.stop(t + dur);
}

export function playShout() {
  burst(196, 0.18, "sawtooth", 0.045, 130);
  noise(0.12, 0.03, 900);
}

export function playHit() {
  noise(0.09, 0.08, 1400);
  burst(90, 0.12, "square", 0.04, 50);
}

export function playSlip() {
  burst(420, 0.28, "triangle", 0.05, 70);
}

export function playEnd() {
  burst(220, 0.4, "triangle", 0.05, 110);
  burst(330, 0.5, "sine", 0.03, 160);
}

function startCrowd() {
  const ac = context();
  if (!ac || !master || crowdGain) return;
  const length = ac.sampleRate * 2;
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  let brown = 0;
  for (let i = 0; i < length; i++) {
    brown = (brown + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = brown * 3.2;
  }
  const src = ac.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 420;
  crowdGain = ac.createGain();
  crowdGain.gain.value = 0.045;
  src.connect(filter);
  filter.connect(crowdGain);
  crowdGain.connect(master);
  src.start();
}
