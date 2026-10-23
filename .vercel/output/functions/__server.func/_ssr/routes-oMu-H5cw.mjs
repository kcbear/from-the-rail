import { i as __toESM } from "../_runtime.mjs";
import { a as CanvasTexture, c as RepeatWrapping, d as require_react, i as useThree, n as Canvas, o as Color, r as useFrame, s as Object3D, t as ContactShadows, u as require_jsx_runtime } from "../_libs/@react-three/drei+[...].mjs";
import { a as Shield, i as Swords, n as Volume2, o as Orbit, s as Citrus, t as VolumeX } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-oMu-H5cw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var palette = {
	bg: "#140e0b",
	surface: "#2a1d16",
	parchment: "#f3ead7",
	muted: "#b5a08a",
	gold: "#e0b15a",
	blood: "#c44536",
	sand: "#c6a36a",
	sandDark: "#a6844e",
	ground: "#1c1410",
	stone: "#4a3b32",
	stoneDark: "#2c221c",
	wood: "#5c4030",
	skin: "#c48a62",
	skinDeep: "#a86b4a",
	steel: "#b7b1a8",
	iron: "#3c342f",
	leather: "#3a2a22",
	flame: "#e7a04a",
	sun: "#ffd7a8",
	peel: "#f0c84a",
	stem: "#6a8f3a",
	bronze: "#8a5a32"
};
var ARENA_R = 6.05;
var ATTACK_COST = 26;
var DEFEND_COST = 8;
var FLEE_COST = 14;
var BLOCK_COST = 7;
var SLIP_COST = 22;
var REGEN = 18;
var DIZZY_REGEN = 20;
var DIZZY_CLEAR = 24;
var BASE_DMG = 18;
var STRIKE_AT = .38;
var ATTACK_DUR = .96;
var DEFEND_DUR = 1.08;
var FLEE_DUR = 1.02;
var SLIP_DUR = 1.18;
var IDLE_GAP = .24;
var DIZZY_GAP = 1.28;
var HIT_RANGE = 1.78;
var ESCAPE_DIST = 1.92;
var DIZZY_ESCAPE = 2.22;
var ACTION_WORD = {
	attack: "Strike",
	defend: "Shield",
	flee: "Circle"
};
var VERB = {
	attack: "strikes",
	defend: "shields",
	flee: "circles"
};
function clamp(n, a, b) {
	return Math.max(a, Math.min(b, n));
}
function createFighter(id, name, x, z) {
	return {
		id,
		name,
		hp: 100,
		stamina: 100,
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
		cooldown: id === "you" ? .45 : .8,
		heard: "none",
		heardT: 0,
		speed: 0,
		hitFlash: 0
	};
}
function createMatch(rng = Math.random) {
	const you = createFighter("you", "Lysander", -2.15, .35);
	const them = createFighter("them", "Corvus", 2.15, -.25);
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
			x: .95,
			y: 1.48,
			z: 8.55,
			fromX: .95,
			fromY: 1.48,
			fromZ: 8.55,
			toX: 0,
			toZ: 0,
			bias: null
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
		rng
	};
}
function pushLog(m, text, tone) {
	m.log.unshift({
		id: m.nextId++,
		text,
		tone
	});
	if (m.log.length > 12) m.log.length = 12;
}
function banner(m, text, tone) {
	m.banner = text;
	m.bannerTone = tone;
	m.bannerT = 1.15;
}
function listenChance(f, cmd, spam) {
	let p = .64;
	if (f.dizzy || f.stamina <= 0) p = .34;
	if (cmd === "attack" && f.stamina < 22) p -= .16;
	if (cmd === "flee" && f.stamina < 14) p -= .08;
	if (spam > 0) p -= .15;
	return clamp(p, .14, .86);
}
function snapshot(m) {
	const view = (f) => ({
		name: f.name,
		hp: clamp(f.hp, 0, 100),
		stamina: clamp(f.stamina, 0, 100),
		dizzy: f.dizzy,
		action: f.action,
		heard: f.heard,
		heardOn: f.heardT > 0
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
		bannerOn: m.bannerT > 0 && m.banner.length > 0
	};
}
function hudSignature(h) {
	const f = (v) => `${Math.round(v.hp)}:${Math.round(v.stamina)}:${v.dizzy ? 1 : 0}:${v.action}:${v.heard}:${v.heardOn ? 1 : 0}`;
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
		h.bannerOn ? h.banner : ""
	].join("|");
}
function face(f, other) {
	f.yaw = Math.atan2(other.x - f.x, other.z - f.z);
}
function markDizzy(m, f) {
	if (f.stamina > 0 || f.dizzyTold) return;
	f.dizzy = true;
	f.dizzyTold = true;
	pushLog(m, `${f.name} is dizzy and planted. Everything he does is half.`, "bad");
	if (f.id === "you") banner(m, "DIZZY", "bad");
}
function spend(m, f, cost) {
	f.stamina = Math.max(0, f.stamina - cost);
	if (f.stamina <= 0) {
		f.dizzy = true;
		markDizzy(m, f);
	}
}
function weights(self, other) {
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
	if (Math.hypot(self.x - other.x, self.z - other.z) > 3.2) {
		flee -= 6;
		attack += 8;
	}
	return {
		attack: Math.max(8, attack),
		defend: Math.max(8, defend),
		flee: Math.max(8, flee)
	};
}
function pick(m, w) {
	const sum = w.attack + w.defend + w.flee;
	let r = m.rng() * sum;
	if ((r -= w.attack) <= 0) return "attack";
	if ((r -= w.defend) <= 0) return "defend";
	return "flee";
}
function startAction(m, f, action) {
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
function finishAction(f) {
	f.action = "idle";
	f.guarding = false;
	f.actionT = 0;
	f.actionDur = 0;
	f.cooldown = f.dizzy ? DIZZY_GAP : IDLE_GAP;
}
function decide(m, f, other) {
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
			pushLog(m, rolled === cmd ? `${f.name} ignored you — and ${VERB[rolled]} anyway.` : `${f.name} ignored you and ${VERB[rolled]}.`, "bad");
			banner(m, "IGNORED", "bad");
		}
		return;
	}
	startAction(m, f, pick(m, w));
}
function speedMul(f) {
	if (f.stamina <= 0) return .1;
	if (f.dizzy) return .4;
	return 1;
}
function moveFighter(f, other, dt) {
	if (f.action === "down" || f.action === "win") {
		f.speed = 0;
		face(f, other);
		return;
	}
	const dx = other.x - f.x;
	const dz = other.z - f.z;
	const dist = Math.hypot(dx, dz) || 1e-4;
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
		const spd = (f.actionT < .44 ? 2.05 : .45) * mul;
		vx = nx * spd;
		vz = nz * spd;
	} else if (f.action === "defend") {
		vx = -nx * .45 * mul;
		vz = -nz * .45 * mul;
	} else if (f.action === "flee") {
		const tx = -nz;
		const tz = nx;
		const outward = 2.55 - dist;
		const fleeMul = mul * (f.dizzy ? .55 : 1);
		vx = tx * 3.15 * fleeMul - nx * outward * 2.1;
		vz = tz * 3.15 * fleeMul - nz * outward * 2.1;
	} else if (dist > 1.55) {
		vx = nx * 1.85 * mul;
		vz = nz * 1.85 * mul;
	} else if (dist < 1.05) {
		vx = -nx * .8;
		vz = -nz * .8;
	}
	f.x += vx * dt;
	f.z += vz * dt;
	f.speed = Math.hypot(vx, vz);
}
function separate(a, b) {
	let dx = b.x - a.x;
	let dz = b.z - a.z;
	let d = Math.hypot(dx, dz);
	const min = .92;
	if (d >= min) return;
	if (d < 1e-4) {
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
function clampArena(f) {
	const d = Math.hypot(f.x, f.z);
	if (d > 6.05) {
		f.x = f.x / d * ARENA_R;
		f.z = f.z / d * ARENA_R;
	}
}
function launchPeel(m) {
	if (m.peel.status !== "ready" || m.phase !== "fight") return;
	const roll = m.rng();
	let bias;
	let tx = 0;
	let tz = 0;
	if (roll < .52) {
		bias = "them";
		const a = m.rng() * Math.PI * 2;
		const r = .2 + m.rng() * .9;
		tx = m.them.x + Math.cos(a) * r;
		tz = m.them.z + Math.sin(a) * r;
	} else if (roll < .74) {
		bias = "open";
		const a = m.rng() * Math.PI * 2;
		const r = .4 + m.rng() * 2.2;
		tx = Math.cos(a) * r;
		tz = Math.sin(a) * r;
	} else {
		bias = "you";
		const a = m.rng() * Math.PI * 2;
		const r = .15 + m.rng() * 1.05;
		tx = m.you.x + Math.cos(a) * r;
		tz = m.you.z + Math.sin(a) * r;
	}
	const d = Math.hypot(tx, tz);
	if (d > 5.6499999999999995) {
		tx *= 5.6499999999999995 / d;
		tz *= 5.6499999999999995 / d;
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
function advancePeel(m, dt) {
	if (m.peel.status !== "flying") return;
	m.peel.t += dt;
	const u = clamp(m.peel.t / .72, 0, 1);
	const e = u * u * (3 - 2 * u);
	m.peel.x = m.peel.fromX + (m.peel.toX - m.peel.fromX) * e;
	m.peel.z = m.peel.fromZ + (m.peel.toZ - m.peel.fromZ) * e;
	m.peel.y = m.peel.fromY + (.07 - m.peel.fromY) * e + Math.sin(Math.PI * u) * 3.1;
	if (u >= 1) {
		m.peel.status = "down";
		m.peel.y = .07;
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
function beginSlip(m, f) {
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
	m.shake = Math.max(m.shake, .42);
	if (f.id === "you") {
		pushLog(m, "Lysander hits the peel. That one did not help.", "bad");
		banner(m, "YOUR SLIP", "bad");
	} else {
		pushLog(m, "Corvus finds the peel and loses his feet.", "good");
		banner(m, "HE SLIPS", "good");
	}
}
function checkPeel(m, f) {
	if (m.peel.status !== "down" || f.slipped) return;
	if (f.action === "down" || f.action === "win" || f.action === "slip") return;
	if (Math.hypot(f.x - m.peel.x, f.z - m.peel.z) > .78) return;
	if ((f.action === "defend" || f.action === "idle" && f.speed < .35) && !f.dizzy && m.rng() < .58) {
		f.slipped = true;
		pushLog(m, `${f.name} watches his feet and steps over the peel.`, "info");
		return;
	}
	beginSlip(m, f);
}
function resolveStrike(att, def) {
	const dist = Math.hypot(att.x - def.x, att.z - def.z);
	const fleeing = def.action === "flee";
	const escapeAt = def.dizzy ? DIZZY_ESCAPE : ESCAPE_DIST;
	if (fleeing && dist >= escapeAt) return {
		kind: "escape",
		dmg: 0
	};
	if (dist > HIT_RANGE) return {
		kind: "miss",
		dmg: 0
	};
	let dmg = BASE_DMG;
	if (att.dizzy) dmg *= .5;
	if (def.action === "slip") dmg *= 1.35;
	let kind = "hit";
	if (def.guarding && def.action !== "slip") {
		const mit = def.dizzy ? .36 : .72;
		dmg *= 1 - mit;
		kind = "block";
	} else if (fleeing) dmg *= .8;
	dmg = Math.max(1, Math.round(dmg));
	return {
		kind,
		dmg
	};
}
function applyStrike(m, att, def) {
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
		m.shake = Math.max(m.shake, .18);
		pushLog(m, `${def.name} blocks — ${res.dmg} gets through.`, "info");
		return;
	}
	def.hp = Math.max(0, def.hp - res.dmg);
	def.hitFlash = 1;
	m.shake = Math.max(m.shake, .34);
	const tone = att.id === "you" ? "good" : "bad";
	pushLog(m, `${att.name} lands ${res.dmg}.`, tone);
}
function conclude(m) {
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
function advanceAction(f, dt) {
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
function recover(m, f, dt) {
	if (f.action !== "idle") return;
	const rate = f.dizzy ? DIZZY_REGEN : REGEN;
	f.stamina = Math.min(100, f.stamina + rate * dt);
	if (f.dizzy && f.stamina >= DIZZY_CLEAR) {
		f.dizzy = false;
		f.dizzyTold = false;
		pushLog(m, `${f.name} catches his breath.`, "good");
		if (f.id === "you") banner(m, "BREATH", "good");
	}
	f.cooldown -= dt;
}
function finishIfDone(f) {
	if (f.action === "idle" || f.action === "down" || f.action === "win") return;
	if (f.actionT >= f.actionDur) finishAction(f);
}
function step(m, dt) {
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
	if (m.phase === "fight" && m.them.action === "idle" && m.them.cooldown <= 0) decide(m, m.them, m.you);
}
function ingestInput(m, input) {
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
function take(root, name) {
	const obj = root.getObjectByName(name);
	if (!obj) throw new Error(`gladiator missing ${name}`);
	return obj;
}
function captureRig(root) {
	return {
		root,
		tilt: take(root, "tilt"),
		body: take(root, "body"),
		legL: take(root, "legL"),
		legR: take(root, "legR"),
		armL: take(root, "armL"),
		armR: take(root, "armR"),
		stars: take(root, "stars"),
		plume: take(root, "plume"),
		chest: take(root, "chest")
	};
}
function lerp(a, b, t) {
	return a + (b - a) * t;
}
function pose(rig, f, time, reduced) {
	const { root, tilt, body, legL, legR, armL, armR, stars, plume, chest } = rig;
	root.position.set(f.x, 0, f.z);
	root.rotation.set(0, f.yaw, 0);
	tilt.rotation.set(0, 0, 0);
	tilt.position.y = .92;
	body.rotation.set(0, 0, 0);
	body.position.set(0, -.92, 0);
	stars.visible = f.dizzy && f.action !== "down";
	stars.rotation.y = reduced ? 0 : time * 2.4;
	plume.rotation.z = reduced ? 0 : Math.sin(time * 6 + f.x) * .12;
	const u = f.actionDur > 0 ? Math.min(1, f.actionT / f.actionDur) : 0;
	const pace = Math.max(1.6, f.speed * 3.2);
	const swing = reduced ? 0 : Math.sin(time * pace + (f.id === "you" ? 0 : 1.2)) * (f.speed > .35 ? .55 : .12);
	legL.rotation.set(swing, 0, 0);
	legR.rotation.set(-swing, 0, 0);
	armR.rotation.set(.45, 0, -.18);
	armL.rotation.set(.35, 0, .35);
	if (f.action === "attack") {
		let slash = .5;
		if (u < .34) slash = lerp(.45, 1.65, u / .34);
		else if (u < .5) slash = lerp(1.65, -1.2, (u - .34) / .16);
		else slash = lerp(-1.2, .4, (u - .5) / .5);
		armR.rotation.set(slash, .1, -.15);
		body.rotation.x = u < .5 ? lerp(0, .32, u / .5) : lerp(.32, .05, (u - .5) / .5);
		legL.rotation.x = -.25;
		legR.rotation.x = .35;
	} else if (f.action === "defend") {
		armL.rotation.set(-1.25, .15, .45);
		armR.rotation.set(-.2, 0, -.4);
		body.rotation.x = -.06;
	} else if (f.action === "flee") {
		body.rotation.x = .28;
		body.rotation.z = reduced ? 0 : Math.sin(time * 11) * .05;
		armR.rotation.set(.8, 0, -.5);
		armL.rotation.set(.7, 0, .5);
	} else if (f.action === "slip") {
		const fall = Math.sin(Math.min(1, u) * Math.PI);
		tilt.rotation.z = fall * 1.15 * (f.id === "you" ? 1 : -1);
		body.rotation.x = .7;
		legL.rotation.x = .6;
		legR.rotation.x = -.3;
		armR.rotation.x = 1.1;
		armL.rotation.x = 1.2;
	} else if (f.action === "down") {
		tilt.rotation.z = (f.id === "you" ? 1 : -1) * 1.28;
		tilt.position.y = .55;
		armR.rotation.x = .9;
		armL.rotation.x = 1.1;
		legL.rotation.x = .2;
		legR.rotation.x = -.15;
	} else if (f.action === "win") {
		armR.rotation.set(-2.55, 0, .1);
		body.position.y = -.92 + (reduced ? 0 : Math.sin(time * 2) * .03);
	} else if (f.dizzy) {
		tilt.rotation.z = reduced ? 0 : Math.sin(time * 8) * .1;
		tilt.rotation.x = reduced ? 0 : Math.cos(time * 6) * .05;
		body.position.y = -.92;
	} else body.position.y = -.92 + (reduced ? 0 : Math.sin(time * 2.1 + f.z) * .025);
	const mat = chest.material;
	if (f.hitFlash > .04) {
		mat.emissive.set(palette.blood);
		mat.emissiveIntensity = f.hitFlash * .85;
	} else if (mat.emissiveIntensity !== 0) {
		mat.emissive.set("#000000");
		mat.emissiveIntensity = 0;
	}
}
function Mat({ color, metal = .08, rough = .72 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
		color,
		metalness: metal,
		roughness: rough,
		flatShading: true
	});
}
function Gladiator({ side, onRig }) {
	const root = (0, import_react.useRef)(null);
	const colors = (0, import_react.useMemo)(() => side === "you" ? {
		cloth: palette.gold,
		plume: palette.gold,
		shield: palette.steel,
		trim: palette.bronze
	} : {
		cloth: palette.blood,
		plume: palette.blood,
		shield: palette.iron,
		trim: palette.stone
	}, [side]);
	const skin = side === "you" ? palette.skin : palette.skinDeep;
	(0, import_react.useLayoutEffect)(() => {
		if (root.current) onRig(captureRig(root.current));
	}, [onRig]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("group", {
		ref: root,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			rotation: [
				-Math.PI / 2,
				0,
				0
			],
			position: [
				0,
				.02,
				0
			],
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circleGeometry", { args: [.42, 14] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshBasicMaterial", {
				color: "#000000",
				transparent: true,
				opacity: .28
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("group", {
			name: "tilt",
			position: [
				0,
				.92,
				0
			],
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("group", {
				name: "body",
				position: [
					0,
					-.92,
					0
				],
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("group", {
						name: "legL",
						position: [
							-.16,
							.9,
							0
						],
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
							position: [
								0,
								-.38,
								0
							],
							castShadow: true,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
								.18,
								.72,
								.18
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mat, { color: skin })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
							position: [
								0,
								-.74,
								.06
							],
							castShadow: true,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
								.2,
								.1,
								.28
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mat, {
								color: palette.leather,
								rough: .9
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("group", {
						name: "legR",
						position: [
							.16,
							.9,
							0
						],
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
							position: [
								0,
								-.38,
								0
							],
							castShadow: true,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
								.18,
								.72,
								.18
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mat, { color: skin })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
							position: [
								0,
								-.74,
								.06
							],
							castShadow: true,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
								.2,
								.1,
								.28
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mat, {
								color: palette.leather,
								rough: .9
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
						position: [
							0,
							1.12,
							0
						],
						castShadow: true,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("cylinderGeometry", { args: [
							.3,
							.4,
							.42,
							7
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mat, {
							color: colors.cloth,
							rough: .85
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
						name: "chest",
						position: [
							0,
							1.42,
							.02
						],
						castShadow: true,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
							.52,
							.4,
							.3
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mat, {
							color: colors.trim,
							metal: .35,
							rough: .45
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
						position: [
							0,
							1.66,
							0
						],
						castShadow: true,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sphereGeometry", { args: [
							.2,
							8,
							7
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mat, { color: skin })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
						position: [
							0,
							1.74,
							0
						],
						castShadow: true,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sphereGeometry", { args: [
							.23,
							8,
							6,
							0,
							Math.PI * 2,
							0,
							Math.PI * .52
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mat, {
							color: palette.steel,
							metal: .55,
							rough: .35
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("group", {
						name: "plume",
						position: [
							0,
							1.92,
							-.06
						],
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
							position: [
								0,
								.16,
								0
							],
							castShadow: true,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("coneGeometry", { args: [
								.07,
								.38,
								5
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mat, {
								color: colors.plume,
								rough: .6
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
							position: [
								.07,
								.1,
								-.02
							],
							rotation: [
								0,
								0,
								-.35
							],
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("coneGeometry", { args: [
								.05,
								.26,
								5
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mat, {
								color: colors.plume,
								rough: .6
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("group", {
						name: "armL",
						position: [
							-.4,
							1.46,
							0
						],
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
								position: [
									0,
									-.26,
									0
								],
								castShadow: true,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
									.14,
									.5,
									.14
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mat, { color: skin })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
								position: [
									-.04,
									-.46,
									.16
								],
								rotation: [
									Math.PI / 2,
									0,
									0
								],
								castShadow: true,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("cylinderGeometry", { args: [
									.34,
									.34,
									.08,
									8
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mat, {
									color: colors.shield,
									metal: .4,
									rough: .4
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
								position: [
									-.04,
									-.46,
									.16
								],
								rotation: [
									Math.PI / 2,
									0,
									0
								],
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("torusGeometry", { args: [
									.34,
									.035,
									6,
									10
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mat, {
									color: colors.cloth,
									metal: .2
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("group", {
						name: "armR",
						position: [
							.4,
							1.46,
							0
						],
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
								position: [
									0,
									-.24,
									0
								],
								castShadow: true,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
									.14,
									.46,
									.14
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mat, { color: skin })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
								position: [
									0,
									-.46,
									.02
								],
								castShadow: true,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
									.24,
									.05,
									.08
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mat, {
									color: palette.gold,
									metal: .45,
									rough: .4
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
								position: [
									0,
									-.86,
									.02
								],
								castShadow: true,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
									.07,
									.78,
									.035
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mat, {
									color: palette.steel,
									metal: .72,
									rough: .28
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("group", {
						name: "stars",
						position: [
							0,
							2.25,
							0
						],
						visible: false,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
								position: [
									.22,
									.08,
									0
								],
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("octahedronGeometry", { args: [.06, 0] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshBasicMaterial", { color: palette.gold })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
								position: [
									-.16,
									.16,
									.06
								],
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("octahedronGeometry", { args: [.05, 0] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshBasicMaterial", { color: palette.gold })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
								position: [
									.02,
									.24,
									-.08
								],
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("octahedronGeometry", { args: [.045, 0] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshBasicMaterial", { color: palette.parchment })]
							})
						]
					})
				]
			})
		})]
	});
}
var STEP = 1 / 60;
var CROWD = 72;
function makeGrain(base, speck) {
	const canvas = document.createElement("canvas");
	canvas.width = 128;
	canvas.height = 128;
	const g = canvas.getContext("2d");
	if (!g) return null;
	g.fillStyle = base;
	g.fillRect(0, 0, 128, 128);
	for (let i = 0; i < 700; i++) {
		g.fillStyle = speck;
		g.globalAlpha = .18 + i % 5 * .04;
		const s = 1 + i % 3;
		g.fillRect(i * 47 % 128, i * 19 % 128, s, s);
	}
	g.globalAlpha = 1;
	const tex = new CanvasTexture(canvas);
	tex.wrapS = RepeatWrapping;
	tex.wrapT = RepeatWrapping;
	tex.repeat.set(5, 5);
	return tex;
}
function Crowd({ reduced }) {
	const bodies = (0, import_react.useRef)(null);
	const heads = (0, import_react.useRef)(null);
	const seats = (0, import_react.useMemo)(() => {
		const list = [];
		for (let i = 0; i < CROWD; i++) {
			const t = i / CROWD;
			const a = Math.PI * 1.12 + t * Math.PI * .76;
			const ring = i % 3;
			const r = 8.2 + ring * .58;
			list.push({
				x: Math.cos(a) * r,
				z: Math.sin(a) * r,
				y: .42 + ring * .16,
				h: .66 + i % 5 * .07,
				phase: i * .65
			});
		}
		return list;
	}, []);
	const colors = (0, import_react.useMemo)(() => [
		palette.blood,
		palette.gold,
		palette.stone,
		palette.parchment,
		palette.iron,
		palette.bronze
	].map((hex) => new Color(hex)), []);
	(0, import_react.useLayoutEffect)(() => {
		const body = bodies.current;
		const head = heads.current;
		if (!body || !head) return;
		const dummy = new Object3D();
		seats.forEach((seat, i) => {
			dummy.position.set(seat.x, seat.y + seat.h * .5, seat.z);
			dummy.rotation.set(0, Math.atan2(seat.x, seat.z), 0);
			dummy.scale.set(.36, seat.h, .28);
			dummy.updateMatrix();
			body.setMatrixAt(i, dummy.matrix);
			body.setColorAt(i, colors[i % colors.length]);
			dummy.position.set(seat.x, seat.y + seat.h + .12, seat.z);
			dummy.scale.set(.18, .18, .18);
			dummy.updateMatrix();
			head.setMatrixAt(i, dummy.matrix);
			head.setColorAt(i, colors[(i + 2) % colors.length]);
		});
		body.instanceMatrix.needsUpdate = true;
		head.instanceMatrix.needsUpdate = true;
		if (body.instanceColor) body.instanceColor.needsUpdate = true;
		if (head.instanceColor) head.instanceColor.needsUpdate = true;
	}, [colors, seats]);
	useFrame(({ clock }) => {
		if (reduced) return;
		const body = bodies.current;
		const head = heads.current;
		if (!body || !head) return;
		const dummy = crowdDummy;
		const t = clock.elapsedTime;
		for (let i = 0; i < seats.length; i++) {
			const seat = seats[i];
			const bob = Math.sin(t * 1.7 + seat.phase) * .035;
			dummy.position.set(seat.x, seat.y + seat.h * .5 + bob, seat.z);
			dummy.rotation.set(0, Math.atan2(seat.x, seat.z), 0);
			dummy.scale.set(.36, seat.h, .28);
			dummy.updateMatrix();
			body.setMatrixAt(i, dummy.matrix);
			dummy.position.set(seat.x, seat.y + seat.h + .12 + bob, seat.z);
			dummy.scale.set(.18, .18, .18);
			dummy.updateMatrix();
			head.setMatrixAt(i, dummy.matrix);
		}
		body.instanceMatrix.needsUpdate = true;
		head.instanceMatrix.needsUpdate = true;
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("group", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("instancedMesh", {
		ref: bodies,
		args: [
			void 0,
			void 0,
			CROWD
		],
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
			1,
			1,
			1
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", { roughness: .9 })]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("instancedMesh", {
		ref: heads,
		args: [
			void 0,
			void 0,
			CROWD
		],
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sphereGeometry", { args: [
			1,
			6,
			5
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
			roughness: .8,
			flatShading: true
		})]
	})] });
}
var crowdDummy = new Object3D();
function Wall() {
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useLayoutEffect)(() => {
		const mesh = ref.current;
		if (!mesh) return;
		const dummy = new Object3D();
		const color = new Color(palette.stone);
		const dark = new Color(palette.stoneDark);
		const count = 32;
		for (let i = 0; i < count; i++) {
			const a = i / count * Math.PI * 2;
			const r = 7.05;
			dummy.position.set(Math.cos(a) * r, .68, Math.sin(a) * r);
			dummy.rotation.set(0, -a, 0);
			dummy.scale.set(1.55, 1.36, .48);
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
			mesh.setColorAt(i, i % 3 === 0 ? dark : color);
		}
		mesh.instanceMatrix.needsUpdate = true;
		if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("instancedMesh", {
		ref,
		args: [
			void 0,
			void 0,
			32
		],
		castShadow: true,
		receiveShadow: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
			1,
			1,
			1
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", { roughness: .92 })]
	});
}
function Torch({ position }) {
	const fire = (0, import_react.useRef)(null);
	useFrame(({ clock }) => {
		const mesh = fire.current;
		if (!mesh) return;
		const s = 1 + Math.sin(clock.elapsedTime * 14 + position[0] * 2) * .12;
		mesh.scale.set(s, .85 + s * .3, s);
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("group", {
		position,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			position: [
				0,
				.55,
				0
			],
			castShadow: true,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("cylinderGeometry", { args: [
				.08,
				.12,
				1.15,
				6
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				color: palette.wood,
				roughness: .85
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("group", {
			ref: fire,
			position: [
				0,
				1.22,
				0
			],
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("coneGeometry", { args: [
				.12,
				.42,
				6
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				color: palette.flame,
				emissive: palette.flame,
				emissiveIntensity: 1.5,
				flatShading: true
			})] })
		})]
	});
}
function Arena({ sim, input, onHud, reduced }) {
	const youRig = (0, import_react.useRef)(null);
	const themRig = (0, import_react.useRef)(null);
	const peelRef = (0, import_react.useRef)(null);
	const acc = (0, import_react.useRef)(0);
	const sig = (0, import_react.useRef)("");
	const takeYou = (0, import_react.useCallback)((rig) => {
		youRig.current = rig;
	}, []);
	const takeThem = (0, import_react.useCallback)((rig) => {
		themRig.current = rig;
	}, []);
	const sand = (0, import_react.useMemo)(() => makeGrain(palette.sand, palette.sandDark), []);
	const camera = useThree((s) => s.camera);
	useFrame((_, raw) => {
		const m = sim.current;
		const cmd = input.current;
		if (!m || !cmd) return;
		const dt = Math.min(raw, .1);
		ingestInput(m, cmd);
		if (m.phase === "fight") {
			acc.current = Math.min(.25, acc.current + dt);
			let guard = 0;
			while (acc.current >= STEP && guard < 8) {
				acc.current -= STEP;
				step(m, STEP);
				guard += 1;
			}
		} else if (m.phase === "end") step(m, dt);
		const time = m.t;
		if (youRig.current) pose(youRig.current, m.you, time, reduced);
		if (themRig.current) pose(themRig.current, m.them, time, reduced);
		const peel = peelRef.current;
		if (peel) {
			peel.position.set(m.peel.x, m.peel.y, m.peel.z);
			peel.rotation.x = m.peel.status === "down" ? 1.2 : .6;
			peel.rotation.z = m.peel.status === "flying" ? time * 9 : .4;
			peel.rotation.y = time * .4;
		}
		const shake = reduced ? 0 : m.shake;
		camera.position.set(Math.sin(time * 32) * shake * .22, 4.85 + Math.cos(time * 27) * shake * .12, 12.35);
		camera.lookAt(0, .85, 0);
		const hud = snapshot(m);
		const next = hudSignature(hud);
		if (next !== sig.current) {
			sig.current = next;
			onHud(hud);
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("color", {
			attach: "background",
			args: [palette.bg]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("fog", {
			attach: "fog",
			args: [
				palette.bg,
				16,
				30
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("hemisphereLight", { args: [
			palette.sun,
			palette.ground,
			.72
		] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ambientLight", { intensity: .22 }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("directionalLight", {
			position: [
				5.5,
				12,
				6
			],
			intensity: 1.7,
			color: palette.sun,
			castShadow: true,
			"shadow-mapSize-width": 1024,
			"shadow-mapSize-height": 1024,
			"shadow-camera-near": 2,
			"shadow-camera-far": 28,
			"shadow-camera-left": -12,
			"shadow-camera-right": 12,
			"shadow-camera-top": 12,
			"shadow-camera-bottom": -12,
			"shadow-bias": -6e-4
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pointLight", {
			position: [
				-4.2,
				2.4,
				2
			],
			color: palette.flame,
			intensity: 6,
			distance: 12,
			decay: 2
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pointLight", {
			position: [
				4.2,
				2.4,
				-1
			],
			color: palette.flame,
			intensity: 5,
			distance: 11,
			decay: 2
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			rotation: [
				-Math.PI / 2,
				0,
				0
			],
			position: [
				0,
				-.04,
				0
			],
			receiveShadow: true,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circleGeometry", { args: [24, 40] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				color: palette.ground,
				roughness: 1
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			rotation: [
				-Math.PI / 2,
				0,
				0
			],
			position: [
				0,
				.01,
				0
			],
			receiveShadow: true,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circleGeometry", { args: [6.55, 56] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				map: sand ?? void 0,
				color: palette.sand,
				roughness: 1
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			rotation: [
				-Math.PI / 2,
				0,
				0
			],
			position: [
				0,
				.012,
				0
			],
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ringGeometry", { args: [
				6.15,
				6.7,
				48
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				color: palette.stoneDark,
				roughness: 1
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wall, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crowd, { reduced }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Torch, { position: [
			-5.4,
			0,
			3.2
		] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Torch, { position: [
			5.4,
			0,
			3.2
		] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Torch, { position: [
			-3.6,
			0,
			-5.1
		] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Torch, { position: [
			3.6,
			0,
			-5.1
		] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			position: [
				0,
				1.12,
				8.85
			],
			castShadow: true,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
				6.4,
				.12,
				.16
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				color: palette.wood,
				roughness: .84
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			position: [
				-3.05,
				.58,
				8.85
			],
			castShadow: true,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
				.14,
				1.16,
				.14
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				color: palette.wood,
				roughness: .84
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			position: [
				3.05,
				.58,
				8.85
			],
			castShadow: true,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("boxGeometry", { args: [
				.14,
				1.16,
				.14
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				color: palette.wood,
				roughness: .84
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
			position: [
				-1.35,
				1.28,
				8.55
			],
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("cylinderGeometry", { args: [
				.1,
				.08,
				.18,
				8
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
				color: palette.blood,
				roughness: .55
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("group", {
			ref: peelRef,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
				rotation: [
					.4,
					0,
					.2
				],
				castShadow: true,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("torusGeometry", { args: [
					.2,
					.065,
					6,
					12,
					Math.PI * 1.25
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
					color: palette.peel,
					roughness: .45,
					flatShading: true
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
				position: [
					.16,
					.02,
					0
				],
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("sphereGeometry", { args: [
					.045,
					6,
					6
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
					color: palette.stem,
					roughness: .7
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gladiator, {
			side: "you",
			onRig: takeYou
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gladiator, {
			side: "them",
			onRig: takeThem
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContactShadows, {
			position: [
				0,
				.02,
				0
			],
			opacity: .45,
			scale: 16,
			blur: 2.4,
			far: 3.5
		})
	] });
}
function statusLine(f) {
	if (f.action === "down") return "Down";
	if (f.action === "win") return "Holds the sand";
	if (f.action === "slip") return "Slipping";
	if (f.dizzy && f.stamina <= 1) return "Dizzy and stuck";
	if (f.dizzy) return "Dizzy, half strength";
	if (f.action === "attack") return "Striking";
	if (f.action === "defend") return "Shielding";
	if (f.action === "flee") return "Circling";
	return "On his own";
}
function Meter({ value, max, tone }) {
	const pct = Math.max(0, Math.min(100, value / max * 100));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-2 w-full overflow-hidden rounded-full bg-bg",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `h-full rounded-full ${tone === "you" ? "bg-primary" : tone === "them" ? "bg-blood" : tone === "gassed" ? "bg-blood" : "bg-muted"}`,
			style: { width: `${pct}%` }
		})
	});
}
function Card({ f, side }) {
	const right = side === "them";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: `min-w-0 border bg-bg/80 p-3 backdrop-blur-sm ${right ? "border-blood/50 text-right" : "border-primary/40"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs tracking-widest text-muted",
				children: right ? "HOUSE" : "YOUR MAN"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "truncate font-display text-xl leading-tight text-fg",
				children: f.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `mt-2 flex items-center gap-2 ${right ? "flex-row-reverse" : ""}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "w-8 text-xs tabular-nums text-muted",
					children: Math.round(f.hp)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
					value: f.hp,
					max: 100,
					tone: right ? "them" : "you"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `mt-1.5 flex items-center gap-2 ${right ? "flex-row-reverse" : ""}`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "w-8 text-xs tabular-nums text-muted",
					children: Math.round(f.stamina)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
					value: f.stamina,
					max: 100,
					tone: f.dizzy || f.stamina <= 1 ? "gassed" : "stamina"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: `mt-2 text-sm ${f.dizzy ? "text-blood" : "text-fg"}`,
				children: statusLine(f)
			})
		]
	});
}
var SHOUTS = [
	{
		id: "attack",
		label: "Strike",
		hint: "1",
		icon: Swords
	},
	{
		id: "defend",
		label: "Shield",
		hint: "2",
		icon: Shield
	},
	{
		id: "flee",
		label: "Circle",
		hint: "3",
		icon: Orbit
	}
];
function Hud({ hud, muted, record, onStart, onAgain, onShout, onPeel, onMute }) {
	const fighting = hud.phase === "fight";
	const pct = Math.round(hud.listen * 100);
	const muteBtn = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick: onMute,
		"aria-label": muted ? "Unmute crowd" : "Mute crowd",
		className: "flex size-11 shrink-0 items-center justify-center border border-primary/30 bg-bg text-fg",
		children: muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-5" })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 flex flex-col",
		children: fighting ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2 p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					f: hud.you,
					side: "you"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					f: hud.them,
					side: "them"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none flex flex-1 items-center justify-center px-4",
				children: hud.bannerOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					"aria-live": "polite",
					className: `font-display text-4xl tracking-widest sm:text-5xl ${hud.bannerTone === "good" || hud.bannerTone === "peel" ? "text-primary" : hud.bannerTone === "bad" ? "text-blood" : "text-fg"}`,
					children: hud.banner
				}) : null
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2 p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"aria-live": "polite",
						className: "max-h-24 overflow-hidden border border-primary/20 bg-bg/80 px-3 py-2 text-sm leading-snug",
						children: hud.log.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-muted",
							children: "The sand is quiet. Shout."
						}) : hud.log.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: line.tone === "good" || line.tone === "peel" ? "text-primary" : line.tone === "bad" ? "text-blood" : "text-fg",
							children: line.text
						}, line.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-3 gap-2",
						children: SHOUTS.map((shout) => {
							const on = hud.queued === shout.id;
							const Icon = shout.icon;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								"data-testid": `shout-${shout.id}`,
								onClick: () => onShout(shout.id),
								className: `flex min-h-14 flex-col items-center justify-center gap-0.5 border px-2 py-2 font-semibold ${on ? "border-primary bg-primary text-bg" : "border-primary/30 bg-surface text-fg"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
									className: "size-5",
									"aria-hidden": true
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: shout.label })]
							}, shout.id);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						"data-testid": "throw-peel",
						disabled: hud.peel !== "ready",
						onClick: onPeel,
						className: "flex min-h-12 items-center justify-center gap-2 bg-primary px-3 py-2 font-semibold text-bg disabled:bg-surface disabled:text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Citrus, {
							className: "size-5",
							"aria-hidden": true
						}), hud.peel === "ready" ? "Throw the peel" : hud.peel === "flying" ? "Peel in the air" : "Peel is on the sand"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "min-w-0 flex-1 text-sm text-muted",
							children: [hud.you.dizzy ? `Dizzy. He hears about ${pct}% of shouts, and what he does is half.` : hud.spam > 0 ? `You talked over yourself. Listen chance ${pct}%.` : `Shout and he listens about ${pct}% of the time.`, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "hidden sm:inline",
								children: " Keys 1, 2, 3, B."
							})]
						}), muteBtn]
					})
				]
			})
		] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex flex-1 items-end justify-center bg-bg/50 p-3 sm:items-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-h-full w-full max-w-md overflow-y-auto border border-primary/35 bg-surface px-5 py-6 sm:px-7",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs tracking-widest text-primary",
							children: "THE FRONT SEAT"
						}), muteBtn]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 font-display text-4xl leading-none text-fg sm:text-5xl",
						children: "From the Rail"
					}),
					hud.phase === "ready" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-base leading-relaxed text-fg",
						children: "Lysander does not take orders. He strikes, shields, or circles on his own. You only get to shout."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "mt-4 flex flex-col gap-1.5 text-sm leading-relaxed text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "A shout lands only when he listens." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "No stamina: he sticks, goes dizzy, and every action is half." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "One banana peel a bout. It does not care whose feet it finds." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "No health ends it. Both at none is a draw." })
						]
					})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 font-display text-3xl text-fg",
						children: hud.result === "win" ? "The sand is yours." : hud.result === "loss" ? "The house takes it." : "Both down. A draw."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-muted",
						children: [
							"Lysander ",
							Math.round(hud.you.hp),
							" health · Corvus ",
							Math.round(hud.them.hp),
							" health"
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-4 text-sm tabular-nums text-muted",
						children: [
							"Record ",
							record.wins,
							"–",
							record.losses,
							"–",
							record.draws
						]
					}),
					hud.phase === "ready" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"data-testid": "start-bout",
						onClick: onStart,
						className: "mt-5 min-h-12 w-full bg-primary px-4 py-3 font-semibold text-bg",
						children: "Take the front seat"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"data-testid": "again",
						onClick: onAgain,
						className: "mt-5 min-h-12 w-full bg-primary px-4 py-3 font-semibold text-bg",
						children: "Another bout"
					})
				]
			})
		})
	});
}
var ctx = null;
var master = null;
var crowdGain = null;
var started = false;
function context() {
	if (typeof window === "undefined") return null;
	if (!ctx) {
		const AC = window.AudioContext || window.webkitAudioContext;
		if (!AC) return null;
		ctx = new AC();
		master = ctx.createGain();
		master.gain.value = 1;
		master.connect(ctx.destination);
	}
	return ctx;
}
function unlockAudio() {
	const ac = context();
	if (!ac || !master) return;
	if (ac.state === "suspended") ac.resume();
	if (!started) {
		started = true;
		startCrowd();
	}
}
function resumeAudio() {
	if (ctx && ctx.state === "suspended") ctx.resume();
}
function setMuted(muted) {
	if (!master) return;
	master.gain.value = muted ? 0 : 1;
}
function burst(freq, dur, type, peak, slideTo) {
	const ac = context();
	if (!ac || !master) return;
	const t = ac.currentTime;
	const osc = ac.createOscillator();
	const gain = ac.createGain();
	osc.type = type;
	osc.frequency.setValueAtTime(freq, t);
	if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t + dur);
	gain.gain.setValueAtTime(1e-4, t);
	gain.gain.exponentialRampToValueAtTime(peak, t + .02);
	gain.gain.exponentialRampToValueAtTime(1e-4, t + dur);
	osc.connect(gain);
	gain.connect(master);
	osc.start(t);
	osc.stop(t + dur + .02);
}
function noise(dur, peak, freq) {
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
	filter.Q.value = .7;
	const gain = ac.createGain();
	const t = ac.currentTime;
	gain.gain.setValueAtTime(peak, t);
	gain.gain.exponentialRampToValueAtTime(1e-4, t + dur);
	src.connect(filter);
	filter.connect(gain);
	gain.connect(master);
	src.start(t);
	src.stop(t + dur);
}
function playShout() {
	burst(196, .18, "sawtooth", .045, 130);
	noise(.12, .03, 900);
}
function playHit() {
	noise(.09, .08, 1400);
	burst(90, .12, "square", .04, 50);
}
function playSlip() {
	burst(420, .28, "triangle", .05, 70);
}
function playEnd() {
	burst(220, .4, "triangle", .05, 110);
	burst(330, .5, "sine", .03, 160);
}
function startCrowd() {
	const ac = context();
	if (!ac || !master || crowdGain) return;
	const length = ac.sampleRate * 2;
	const buffer = ac.createBuffer(1, length, ac.sampleRate);
	const data = buffer.getChannelData(0);
	let brown = 0;
	for (let i = 0; i < length; i++) {
		brown = (brown + .02 * (Math.random() * 2 - 1)) / 1.02;
		data[i] = brown * 3.2;
	}
	const src = ac.createBufferSource();
	src.buffer = buffer;
	src.loop = true;
	const filter = ac.createBiquadFilter();
	filter.type = "lowpass";
	filter.frequency.value = 420;
	crowdGain = ac.createGain();
	crowdGain.gain.value = .045;
	src.connect(filter);
	filter.connect(crowdGain);
	crowdGain.connect(master);
	src.start();
}
var RECORD_KEY = "from-the-rail-v1";
function emptyRecord() {
	return {
		wins: 0,
		losses: 0,
		draws: 0
	};
}
function loadRecord() {
	if (typeof window === "undefined") return emptyRecord();
	try {
		const raw = localStorage.getItem(RECORD_KEY);
		if (!raw) return emptyRecord();
		const parsed = JSON.parse(raw);
		if (typeof parsed.wins !== "number" || typeof parsed.losses !== "number" || typeof parsed.draws !== "number") return emptyRecord();
		return {
			wins: parsed.wins,
			losses: parsed.losses,
			draws: parsed.draws
		};
	} catch {
		return emptyRecord();
	}
}
function Game() {
	const sim = (0, import_react.useRef)(createMatch());
	const input = (0, import_react.useRef)({
		serial: 0,
		command: null,
		peel: false,
		spam: 0
	});
	const [hud, setHud] = (0, import_react.useState)(() => snapshot(sim.current));
	const [live, setLive] = (0, import_react.useState)(false);
	const [reduced, setReduced] = (0, import_react.useState)(false);
	const [muted, setMutedState] = (0, import_react.useState)(false);
	const [record, setRecord] = (0, import_react.useState)(emptyRecord);
	const saved = (0, import_react.useRef)(false);
	const heard = (0, import_react.useRef)(0);
	const mutedRef = (0, import_react.useRef)(false);
	mutedRef.current = muted;
	(0, import_react.useEffect)(() => {
		setLive(true);
		setRecord(loadRecord());
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		const apply = () => setReduced(mq.matches);
		apply();
		mq.addEventListener("change", apply);
		const onVis = () => {
			if (document.visibilityState === "visible") resumeAudio();
		};
		document.addEventListener("visibilitychange", onVis);
		return () => {
			mq.removeEventListener("change", apply);
			document.removeEventListener("visibilitychange", onVis);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (hud.phase !== "end" || !hud.result) {
			saved.current = false;
			return;
		}
		if (saved.current) return;
		saved.current = true;
		setRecord((prev) => {
			const next = { ...prev };
			if (hud.result === "win") next.wins += 1;
			else if (hud.result === "loss") next.losses += 1;
			else next.draws += 1;
			localStorage.setItem(RECORD_KEY, JSON.stringify(next));
			return next;
		});
	}, [hud.phase, hud.result]);
	(0, import_react.useEffect)(() => {
		const line = hud.log[0];
		if (!line || line.id === heard.current) return;
		heard.current = line.id;
		if (line.text.includes("lands") || line.text.includes("blocks")) playHit();
		else if (line.text.includes("hits the peel") || line.text.includes("finds the peel")) playSlip();
		else if (line.text.includes("drops") || line.text.includes("calls a draw")) playEnd();
	}, [hud.log]);
	const onHud = (0, import_react.useCallback)((next) => {
		setHud(next);
	}, []);
	function bootAudio() {
		unlockAudio();
		setMuted(mutedRef.current);
	}
	function start() {
		bootAudio();
		if (sim.current.phase !== "ready") return;
		sim.current.phase = "fight";
		setHud(snapshot(sim.current));
	}
	function again() {
		bootAudio();
		const fresh = createMatch();
		fresh.seenSerial = input.current.serial;
		input.current.command = null;
		input.current.peel = false;
		input.current.spam = 0;
		sim.current = fresh;
		fresh.phase = "fight";
		setHud(snapshot(fresh));
	}
	function shout(action) {
		if (sim.current.phase !== "fight") return;
		bootAudio();
		const cmd = input.current;
		if (cmd.command && cmd.serial !== sim.current.seenSerial) cmd.spam += 1;
		cmd.command = action;
		cmd.serial += 1;
		playShout();
	}
	function peel() {
		if (sim.current.phase !== "fight" || sim.current.peel.status !== "ready") return;
		bootAudio();
		input.current.peel = true;
	}
	function toggleMute() {
		setMutedState((prev) => {
			const next = !prev;
			setMuted(next);
			return next;
		});
	}
	(0, import_react.useEffect)(() => {
		const onKey = (event) => {
			if (event.repeat) return;
			const phase = sim.current.phase;
			if (event.key === "Enter" && phase === "ready") start();
			else if (event.key === "Enter" && phase === "end") again();
			else if (event.key === "1") shout("attack");
			else if (event.key === "2") shout("defend");
			else if (event.key === "3") shout("flee");
			else if (event.key === "b" || event.key === "B") peel();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative h-dvh overflow-hidden bg-bg text-fg",
		children: [
			live ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Canvas, {
					shadows: true,
					dpr: [1, 1.6],
					camera: {
						position: [
							0,
							4.85,
							12.35
						],
						fov: 38,
						near: .1,
						far: 42
					},
					gl: {
						antialias: true,
						toneMapping: 4,
						toneMappingExposure: 1.05
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Arena, {
						sim,
						input,
						onHud,
						reduced
					})
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pit-vignette pointer-events-none absolute inset-0" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hud, {
				hud,
				muted,
				record,
				onStart: start,
				onAgain: again,
				onShout: shout,
				onPeel: peel,
				onMute: toggleMute
			})
		]
	});
}
var SplitComponent = Game;
//#endregion
export { SplitComponent as component };
