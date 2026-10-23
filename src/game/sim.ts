export type Action = "attack" | "defend" | "flee";
export type Side = "you" | "them";
export type BoutPhase = "ready" | "fight" | "end";
export type Result = "win" | "loss" | "draw";
export type Act =
  | "idle"
  | "attack"
  | "defend"
  | "flee"
  | "slip"
  | "down"
  | "win";

export const MAX_HP = 100;
export const MAX_STAMINA = 100;
export const ARENA_R = 6.05;

const ATTACK_COST = 26;
const DEFEND_COST = 8;
const FLEE_COST = 14;
const BLOCK_COST = 7;
const SLIP_COST = 22;
const REGEN = 18;
const DIZZY_REGEN = 20;
const DIZZY_CLEAR = 24;
const BASE_DMG = 18;
const STRIKE_AT = 0.38;
const ATTACK_DUR = 0.96;
const DEFEND_DUR = 1.08;
const FLEE_DUR = 1.02;
const SLIP_DUR = 1.18;
const IDLE_GAP = 0.24;
const DIZZY_GAP = 1.28;
const HIT_RANGE = 1.78;
const ESCAPE_DIST = 1.92;
const DIZZY_ESCAPE = 2.22;

export const ACTION_WORD: Record<Action, string> = {
  attack: "Strike",
  defend: "Shield",
  flee: "Circle",
};

const VERB: Record<Action, string> = {
  attack: "strikes",
  defend: "shields",
  flee: "circles",
};

export interface Fighter {
  id: Side;
  name: string;
  hp: number;
  stamina: number;
  x: number;
  z: number;
  yaw: number;
  action: Act;
  actionT: number;
  actionDur: number;
  dizzy: boolean;
  dizzyTold: boolean;
  guarding: boolean;
  struck: boolean;
  slipped: boolean;
  cooldown: number;
  heard: "none" | "heard" | "ignored";
  heardT: number;
  speed: number;
  hitFlash: number;
}

export interface Peel {
  status: "ready" | "flying" | "down";
  t: number;
  x: number;
  y: number;
  z: number;
  fromX: number;
  fromY: number;
  fromZ: number;
  toX: number;
  toZ: number;
  bias: "them" | "you" | "open" | null;
}

export interface LogLine {
  id: number;
  text: string;
  tone: "info" | "good" | "bad" | "peel";
}

export type BannerTone = "good" | "bad" | "info" | "peel";

export interface Match {
  phase: BoutPhase;
  result: Result | null;
  t: number;
  you: Fighter;
  them: Fighter;
  peel: Peel;
  log: LogLine[];
  shake: number;
  nextId: number;
  queued: Action | null;
  spam: number;
  seenSerial: number;
  requestPeel: boolean;
  banner: string;
  bannerTone: BannerTone;
  bannerT: number;
  rng: () => number;
}

export interface InputCmd {
  serial: number;
  command: Action | null;
  peel: boolean;
  spam: number;
}

export interface FighterView {
  name: string;
  hp: number;
  stamina: number;
  dizzy: boolean;
  action: Act;
  heard: Fighter["heard"];
  heardOn: boolean;
}

export interface HudModel {
  phase: BoutPhase;
  result: Result | null;
  you: FighterView;
  them: FighterView;
  peel: Peel["status"];
  queued: Action | null;
  listen: number;
  spam: number;
  log: LogLine[];
  banner: string;
  bannerTone: BannerTone;
  bannerOn: boolean;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function createFighter(id: Side, name: string, x: number, z: number): Fighter {
  const f: Fighter = {
    id,
    name,
    hp: MAX_HP,
    stamina: MAX_STAMINA,
    x,
    z,
    yaw: 0,
    action: "idle",
    actionT: 0,
    actionDur: 0,
    dizzy: false,
    dizzyTold: false,
    guarding: false,
    struck: false,
    slipped: false,
    cooldown: id === "you" ? 0.45 : 0.8,
    heard: "none",
    heardT: 0,
    speed: 0,
    hitFlash: 0,
  };
  return f;
}

export function createMatch(rng: () => number = Math.random): Match {
  const you = createFighter("you", "Lysander", -2.15, 0.35);
  const them = createFighter("them", "Corvus", 2.15, -0.25);
  face(you, them);
  face(them, you);
  return {
    phase: "ready",
    result: null,
    t: 0,
    you,
    them,
    peel: {
      status: "ready",
      t: 0,
      x: 0.95,
      y: 1.48,
      z: 8.55,
      fromX: 0.95,
      fromY: 1.48,
      fromZ: 8.55,
      toX: 0,
      toZ: 0,
      bias: null,
    },
    log: [],
    shake: 0,
    nextId: 1,
    queued: null,
    spam: 0,
    seenSerial: 0,
    requestPeel: false,
    banner: "",
    bannerTone: "info",
    bannerT: 0,
    rng,
  };
}

export function pushLog(m: Match, text: string, tone: LogLine["tone"]) {
  m.log.unshift({ id: m.nextId++, text, tone });
  if (m.log.length > 12) m.log.length = 12;
}

function banner(m: Match, text: string, tone: BannerTone) {
  m.banner = text;
  m.bannerTone = tone;
  m.bannerT = 1.15;
}

export function listenChance(f: Fighter, cmd: Action | null, spam: number) {
  let p = 0.64;
  if (f.dizzy || f.stamina <= 0) p = 0.34;
  if (cmd === "attack" && f.stamina < 22) p -= 0.16;
  if (cmd === "flee" && f.stamina < 14) p -= 0.08;
  if (spam > 0) p -= 0.15;
  return clamp(p, 0.14, 0.86);
}

export function snapshot(m: Match): HudModel {
  const view = (f: Fighter): FighterView => ({
    name: f.name,
    hp: clamp(f.hp, 0, MAX_HP),
    stamina: clamp(f.stamina, 0, MAX_STAMINA),
    dizzy: f.dizzy,
    action: f.action,
    heard: f.heard,
    heardOn: f.heardT > 0,
  });
  return {
    phase: m.phase,
    result: m.result,
    you: view(m.you),
    them: view(m.them),
    peel: m.peel.status,
    queued: m.queued,
    listen: listenChance(m.you, m.queued, m.spam),
    spam: m.spam,
    log: m.log.slice(0, 4),
    banner: m.banner,
    bannerTone: m.bannerTone,
    bannerOn: m.bannerT > 0 && m.banner.length > 0,
  };
}

export function hudSignature(h: HudModel) {
  const f = (v: FighterView) =>
    `${Math.round(v.hp)}:${Math.round(v.stamina)}:${v.dizzy ? 1 : 0}:${v.action}:${v.heard}:${v.heardOn ? 1 : 0}`;
  return [
    h.phase,
    h.result ?? "-",
    f(h.you),
    f(h.them),
    h.peel,
    h.queued ?? "-",
    Math.round(h.listen * 100),
    h.spam,
    h.log[0]?.id ?? 0,
    h.bannerOn ? h.banner : "",
  ].join("|");
}

function face(f: Fighter, other: Fighter) {
  f.yaw = Math.atan2(other.x - f.x, other.z - f.z);
}

function markDizzy(m: Match, f: Fighter) {
  if (f.stamina > 0 || f.dizzyTold) return;
  f.dizzy = true;
  f.dizzyTold = true;
  pushLog(
    m,
    `${f.name} is dizzy and planted. Everything he does is half.`,
    "bad",
  );
  if (f.id === "you") banner(m, "DIZZY", "bad");
}

function spend(m: Match, f: Fighter, cost: number) {
  f.stamina = Math.max(0, f.stamina - cost);
  if (f.stamina <= 0) {
    f.dizzy = true;
    markDizzy(m, f);
  }
}

function weights(self: Fighter, other: Fighter) {
  let attack = 36;
  let defend = 32;
  let flee = 32;
  if (self.hp < 36) {
    defend += 12;
    flee += 8;
    attack -= 4;
  }
  if (other.hp < 30) attack += 12;
  if (other.dizzy || other.action === "slip") attack += 16;
  if (self.dizzy) {
    attack -= 4;
    defend += 6;
  }
  const dist = Math.hypot(self.x - other.x, self.z - other.z);
  if (dist > 3.2) {
    flee -= 6;
    attack += 8;
  }
  return {
    attack: Math.max(8, attack),
    defend: Math.max(8, defend),
    flee: Math.max(8, flee),
  };
}

function pick(m: Match, w: { attack: number; defend: number; flee: number }): Action {
  const sum = w.attack + w.defend + w.flee;
  let r = m.rng() * sum;
  if ((r -= w.attack) <= 0) return "attack";
  if ((r -= w.defend) <= 0) return "defend";
  return "flee";
}

function startAction(m: Match, f: Fighter, action: Action) {
  f.action = action;
  f.actionT = 0;
  f.struck = false;
  f.guarding = action === "defend";
  if (action === "attack") {
    f.actionDur = ATTACK_DUR;
    spend(m, f, ATTACK_COST);
  } else if (action === "defend") {
    f.actionDur = DEFEND_DUR;
    spend(m, f, DEFEND_COST);
  } else {
    f.actionDur = FLEE_DUR;
    spend(m, f, FLEE_COST);
  }
}

function finishAction(f: Fighter) {
  f.action = "idle";
  f.guarding = false;
  f.actionT = 0;
  f.actionDur = 0;
  f.cooldown = f.dizzy ? DIZZY_GAP : IDLE_GAP;
}

function decide(m: Match, f: Fighter, other: Fighter) {
  if (m.phase !== "fight") return;
  const w = weights(f, other);
  if (f.id === "you" && m.queued) {
    const cmd = m.queued;
    const spam = m.spam;
    m.queued = null;
    m.spam = 0;
    const p = listenChance(f, cmd, spam);
    const heard = m.rng() < p;
    f.heardT = 1.2;
    if (heard) {
      f.heard = "heard";
      startAction(m, f, cmd);
      pushLog(m, `${f.name} heard you. He ${VERB[cmd]}.`, "good");
      banner(m, "HEARD", "good");
    } else {
      f.heard = "ignored";
      const rolled = pick(m, w);
      startAction(m, f, rolled);
      const same = rolled === cmd;
      pushLog(
        m,
        same
          ? `${f.name} ignored you — and ${VERB[rolled]} anyway.`
          : `${f.name} ignored you and ${VERB[rolled]}.`,
        "bad",
      );
      banner(m, "IGNORED", "bad");
    }
    return;
  }
  startAction(m, f, pick(m, w));
}

function speedMul(f: Fighter) {
  if (f.stamina <= 0) return 0.1;
  if (f.dizzy) return 0.4;
  return 1;
}

function moveFighter(f: Fighter, other: Fighter, dt: number) {
  if (f.action === "down" || f.action === "win") {
    f.speed = 0;
    face(f, other);
    return;
  }
  const dx = other.x - f.x;
  const dz = other.z - f.z;
  const dist = Math.hypot(dx, dz) || 0.0001;
  const nx = dx / dist;
  const nz = dz / dist;
  face(f, other);
  const mul = speedMul(f);
  let vx = 0;
  let vz = 0;
  if (f.action === "slip") {
    f.speed = 0;
    return;
  }
  if (f.action === "attack") {
    const lunging = f.actionT < STRIKE_AT + 0.06;
    const spd = (lunging ? 2.05 : 0.45) * mul;
    vx = nx * spd;
    vz = nz * spd;
  } else if (f.action === "defend") {
    vx = -nx * 0.45 * mul;
    vz = -nz * 0.45 * mul;
  } else if (f.action === "flee") {
    const tx = -nz;
    const tz = nx;
    const desired = 2.55;
    const outward = desired - dist;
    const fleeMul = mul * (f.dizzy ? 0.55 : 1);
    vx = tx * 3.15 * fleeMul - nx * outward * 2.1;
    vz = tz * 3.15 * fleeMul - nz * outward * 2.1;
  } else if (dist > 1.55) {
    vx = nx * 1.85 * mul;
    vz = nz * 1.85 * mul;
  } else if (dist < 1.05) {
    vx = -nx * 0.8;
    vz = -nz * 0.8;
  }
  f.x += vx * dt;
  f.z += vz * dt;
  f.speed = Math.hypot(vx, vz);
}

function separate(a: Fighter, b: Fighter) {
  let dx = b.x - a.x;
  let dz = b.z - a.z;
  let d = Math.hypot(dx, dz);
  const min = 0.92;
  if (d >= min) return;
  if (d < 0.0001) {
    dx = 1;
    dz = 0;
    d = 1;
  }
  const push = (min - d) / 2;
  const nx = dx / d;
  const nz = dz / d;
  a.x -= nx * push;
  a.z -= nz * push;
  b.x += nx * push;
  b.z += nz * push;
}

function clampArena(f: Fighter) {
  const d = Math.hypot(f.x, f.z);
  if (d > ARENA_R) {
    f.x = (f.x / d) * ARENA_R;
    f.z = (f.z / d) * ARENA_R;
  }
}

function launchPeel(m: Match) {
  if (m.peel.status !== "ready" || m.phase !== "fight") return;
  const roll = m.rng();
  let bias: "them" | "you" | "open";
  let tx = 0;
  let tz = 0;
  if (roll < 0.52) {
    bias = "them";
    const a = m.rng() * Math.PI * 2;
    const r = 0.2 + m.rng() * 0.9;
    tx = m.them.x + Math.cos(a) * r;
    tz = m.them.z + Math.sin(a) * r;
  } else if (roll < 0.74) {
    bias = "open";
    const a = m.rng() * Math.PI * 2;
    const r = 0.4 + m.rng() * 2.2;
    tx = Math.cos(a) * r;
    tz = Math.sin(a) * r;
  } else {
    bias = "you";
    const a = m.rng() * Math.PI * 2;
    const r = 0.15 + m.rng() * 1.05;
    tx = m.you.x + Math.cos(a) * r;
    tz = m.you.z + Math.sin(a) * r;
  }
  const d = Math.hypot(tx, tz);
  if (d > ARENA_R - 0.4) {
    tx *= (ARENA_R - 0.4) / d;
    tz *= (ARENA_R - 0.4) / d;
  }
  m.peel.status = "flying";
  m.peel.t = 0;
  m.peel.bias = bias;
  m.peel.fromX = m.peel.x;
  m.peel.fromY = m.peel.y;
  m.peel.fromZ = m.peel.z;
  m.peel.toX = tx;
  m.peel.toZ = tz;
  pushLog(m, "You fling the peel from the rail.", "peel");
}

function advancePeel(m: Match, dt: number) {
  if (m.peel.status !== "flying") return;
  m.peel.t += dt;
  const u = clamp(m.peel.t / 0.72, 0, 1);
  const e = u * u * (3 - 2 * u);
  m.peel.x = m.peel.fromX + (m.peel.toX - m.peel.fromX) * e;
  m.peel.z = m.peel.fromZ + (m.peel.toZ - m.peel.fromZ) * e;
  m.peel.y = m.peel.fromY + (0.07 - m.peel.fromY) * e + Math.sin(Math.PI * u) * 3.1;
  if (u >= 1) {
    m.peel.status = "down";
    m.peel.y = 0.07;
    const bias = m.peel.bias;
    if (bias === "them") {
      pushLog(m, "The peel lands by Corvus. It might.", "peel");
      banner(m, "BY CORVUS", "peel");
    } else if (bias === "you") {
      pushLog(m, "Bad toss. The peel slides toward Lysander.", "bad");
      banner(m, "OWN FEET", "bad");
    } else {
      pushLog(m, "The peel skips into empty sand.", "info");
      banner(m, "OPEN SAND", "info");
    }
  }
}

function beginSlip(m: Match, f: Fighter) {
  f.action = "slip";
  f.actionT = 0;
  f.actionDur = SLIP_DUR;
  f.guarding = false;
  f.struck = false;
  f.slipped = true;
  f.hitFlash = 1;
  f.stamina = Math.max(0, f.stamina - SLIP_COST);
  if (f.stamina <= 0) {
    f.dizzy = true;
    markDizzy(m, f);
  }
  m.shake = Math.max(m.shake, 0.42);
  if (f.id === "you") {
    pushLog(m, "Lysander hits the peel. That one did not help.", "bad");
    banner(m, "YOUR SLIP", "bad");
  } else {
    pushLog(m, "Corvus finds the peel and loses his feet.", "good");
    banner(m, "HE SLIPS", "good");
  }
}

function checkPeel(m: Match, f: Fighter) {
  if (m.peel.status !== "down" || f.slipped) return;
  if (f.action === "down" || f.action === "win" || f.action === "slip") return;
  const d = Math.hypot(f.x - m.peel.x, f.z - m.peel.z);
  if (d > 0.78) return;
  const careful = f.action === "defend" || (f.action === "idle" && f.speed < 0.35);
  if (careful && !f.dizzy && m.rng() < 0.58) {
    f.slipped = true;
    pushLog(m, `${f.name} watches his feet and steps over the peel.`, "info");
    return;
  }
  beginSlip(m, f);
}

export interface StrikeResult {
  kind: "hit" | "block" | "escape" | "miss";
  dmg: number;
}

export function resolveStrike(att: Fighter, def: Fighter): StrikeResult {
  const dist = Math.hypot(att.x - def.x, att.z - def.z);
  const fleeing = def.action === "flee";
  const escapeAt = def.dizzy ? DIZZY_ESCAPE : ESCAPE_DIST;
  if (fleeing && dist >= escapeAt) return { kind: "escape", dmg: 0 };
  if (dist > HIT_RANGE) return { kind: "miss", dmg: 0 };
  let dmg = BASE_DMG;
  if (att.dizzy) dmg *= 0.5;
  if (def.action === "slip") dmg *= 1.35;
  let kind: StrikeResult["kind"] = "hit";
  if (def.guarding && def.action !== "slip") {
    const mit = def.dizzy ? 0.36 : 0.72;
    dmg *= 1 - mit;
    kind = "block";
  } else if (fleeing) {
    dmg *= 0.8;
  }
  dmg = Math.max(1, Math.round(dmg));
  return { kind, dmg };
}

function applyStrike(m: Match, att: Fighter, def: Fighter) {
  if (def.action === "down" || def.hp <= 0) return;
  const res = resolveStrike(att, def);
  if (res.kind === "escape") {
    pushLog(m, `${def.name} circles clear. The blade misses.`, "info");
    return;
  }
  if (res.kind === "miss") {
    pushLog(m, `${att.name} swings at air.`, "info");
    return;
  }
  if (res.kind === "block") {
    def.stamina = Math.max(0, def.stamina - BLOCK_COST);
    if (def.stamina <= 0) {
      def.dizzy = true;
      markDizzy(m, def);
    }
    def.hp = Math.max(0, def.hp - res.dmg);
    def.hitFlash = 1;
    m.shake = Math.max(m.shake, 0.18);
    pushLog(m, `${def.name} blocks — ${res.dmg} gets through.`, "info");
    return;
  }
  def.hp = Math.max(0, def.hp - res.dmg);
  def.hitFlash = 1;
  m.shake = Math.max(m.shake, 0.34);
  const tone = att.id === "you" ? "good" : "bad";
  pushLog(m, `${att.name} lands ${res.dmg}.`, tone);
}

function conclude(m: Match) {
  const youDead = m.you.hp <= 0;
  const themDead = m.them.hp <= 0;
  if (!youDead && !themDead) return;
  m.phase = "end";
  m.queued = null;
  if (youDead && themDead) {
    m.result = "draw";
    m.you.action = "down";
    m.them.action = "down";
    m.you.guarding = false;
    m.them.guarding = false;
    pushLog(m, "Both men are down. The sand calls a draw.", "info");
    banner(m, "DRAW", "info");
    return;
  }
  if (themDead) {
    m.result = "win";
    m.them.action = "down";
    m.them.guarding = false;
    if (m.you.hp > 0) {
      m.you.action = "win";
      m.you.guarding = false;
    }
    pushLog(m, "Corvus drops. The bout is yours.", "good");
    banner(m, "VICTORY", "good");
    return;
  }
  m.result = "loss";
  m.you.action = "down";
  m.you.guarding = false;
  if (m.them.hp > 0) {
    m.them.action = "win";
    m.them.guarding = false;
  }
  pushLog(m, "Lysander drops. The house takes it.", "bad");
  banner(m, "DEFEAT", "bad");
}

function advanceAction(f: Fighter, dt: number): boolean {
  f.hitFlash = Math.max(0, f.hitFlash - dt * 2.2);
  f.heardT = Math.max(0, f.heardT - dt);
  if (f.action === "down" || f.action === "win" || f.action === "idle") return false;
  f.actionT += dt;
  if (f.action === "attack" && !f.struck && f.actionT >= STRIKE_AT) {
    f.struck = true;
    return true;
  }
  return false;
}

function recover(m: Match, f: Fighter, dt: number) {
  if (f.action !== "idle") return;
  const rate = f.dizzy ? DIZZY_REGEN : REGEN;
  f.stamina = Math.min(MAX_STAMINA, f.stamina + rate * dt);
  if (f.dizzy && f.stamina >= DIZZY_CLEAR) {
    f.dizzy = false;
    f.dizzyTold = false;
    pushLog(m, `${f.name} catches his breath.`, "good");
    if (f.id === "you") banner(m, "BREATH", "good");
  }
  f.cooldown -= dt;
}

function finishIfDone(f: Fighter) {
  if (f.action === "idle" || f.action === "down" || f.action === "win") return;
  if (f.actionT >= f.actionDur) finishAction(f);
}

export function step(m: Match, dt: number) {
  m.t += dt;
  m.shake = Math.max(0, m.shake - dt * 1.5);
  m.bannerT = Math.max(0, m.bannerT - dt);
  if (m.requestPeel) {
    m.requestPeel = false;
    launchPeel(m);
  }
  advancePeel(m, dt);
  if (m.phase !== "fight") {
    m.you.hitFlash = Math.max(0, m.you.hitFlash - dt * 2.2);
    m.them.hitFlash = Math.max(0, m.them.hitFlash - dt * 2.2);
    return;
  }
  moveFighter(m.you, m.them, dt);
  moveFighter(m.them, m.you, dt);
  separate(m.you, m.them);
  clampArena(m.you);
  clampArena(m.them);
  checkPeel(m, m.you);
  checkPeel(m, m.them);
  recover(m, m.you, dt);
  recover(m, m.them, dt);
  const youStrike = advanceAction(m.you, dt);
  const themStrike = advanceAction(m.them, dt);
  if (youStrike) applyStrike(m, m.you, m.them);
  if (themStrike) applyStrike(m, m.them, m.you);
  conclude(m);
  if (m.phase !== "fight") return;
  finishIfDone(m.you);
  finishIfDone(m.them);
  if (m.you.action === "idle" && m.you.cooldown <= 0) decide(m, m.you, m.them);
  if (m.phase === "fight" && m.them.action === "idle" && m.them.cooldown <= 0) {
    decide(m, m.them, m.you);
  }
}

export function ingestInput(m: Match, input: InputCmd) {
  if (input.serial !== m.seenSerial && input.command && m.phase === "fight") {
    m.spam = (m.queued ? m.spam + 1 : 0) + input.spam;
    input.spam = 0;
    m.queued = input.command;
    m.seenSerial = input.serial;
    pushLog(m, `You shout ${ACTION_WORD[input.command].toUpperCase()}.`, "info");
  } else if (input.serial !== m.seenSerial) {
    m.seenSerial = input.serial;
    input.spam = 0;
  }
  if (input.peel) {
    input.peel = false;
    if (m.phase === "fight" && m.peel.status === "ready") m.requestPeel = true;
  }
}
