import { Citrus, Orbit, Shield, Swords, Volume2, VolumeX } from "lucide-react";
import type { Action, FighterView, HudModel } from "@/game/sim";
import { MAX_HP, MAX_STAMINA } from "@/game/sim";

function statusLine(f: FighterView) {
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

function Meter({
  value,
  max,
  tone,
}: {
  value: number;
  max: number;
  tone: "you" | "them" | "stamina" | "gassed";
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fill =
    tone === "you"
      ? "bg-primary"
      : tone === "them"
        ? "bg-blood"
        : tone === "gassed"
          ? "bg-blood"
          : "bg-muted";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-bg">
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function Card({
  f,
  side,
}: {
  f: FighterView;
  side: "you" | "them";
}) {
  const right = side === "them";
  return (
    <section
      className={`min-w-0 border bg-bg/75 p-2 backdrop-blur-sm sm:p-3 ${
        right ? "border-blood/50 text-right" : "border-primary/40"
      }`}
    >
      <p className="text-xs tracking-widest text-muted">{right ? "HOUSE" : "YOUR MAN"}</p>
      <h2 className="truncate font-display text-lg leading-tight text-fg">{f.name}</h2>
      <div className={`mt-1.5 flex items-center gap-2 ${right ? "flex-row-reverse" : ""}`}>
        <span className="w-7 text-xs tabular-nums text-muted">{Math.round(f.hp)}</span>
        <Meter value={f.hp} max={MAX_HP} tone={right ? "them" : "you"} />
      </div>
      <div className={`mt-1 flex items-center gap-2 ${right ? "flex-row-reverse" : ""}`}>
        <span className="w-7 text-xs tabular-nums text-muted">{Math.round(f.stamina)}</span>
        <Meter
          value={f.stamina}
          max={MAX_STAMINA}
          tone={f.dizzy || f.stamina <= 1 ? "gassed" : "stamina"}
        />
      </div>
      <p className={`mt-1 text-xs ${f.dizzy ? "text-blood" : "text-muted"}`}>{statusLine(f)}</p>
    </section>
  );
}

const SHOUTS: { id: Action; label: string; hint: string; icon: typeof Swords }[] = [
  { id: "attack", label: "Strike", hint: "1", icon: Swords },
  { id: "defend", label: "Shield", hint: "2", icon: Shield },
  { id: "flee", label: "Circle", hint: "3", icon: Orbit },
];

export function Hud({
  hud,
  muted,
  record,
  onStart,
  onAgain,
  onShout,
  onPeel,
  onMute,
}: {
  hud: HudModel;
  muted: boolean;
  record: { wins: number; losses: number; draws: number };
  onStart: () => void;
  onAgain: () => void;
  onShout: (action: Action) => void;
  onPeel: () => void;
  onMute: () => void;
}) {
  const fighting = hud.phase === "fight";
  const pct = Math.round(hud.listen * 100);
  const muteBtn = (
    <button
      type="button"
      onClick={onMute}
      aria-label={muted ? "Unmute crowd" : "Mute crowd"}
      className="flex size-11 shrink-0 items-center justify-center border border-primary/30 bg-bg text-fg"
    >
      {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
    </button>
  );
  return (
    <div className="absolute inset-0 flex flex-col">
      {fighting ? (
        <>
          <div className="grid grid-cols-2 gap-2 p-2 sm:p-3">
            <Card f={hud.you} side="you" />
            <Card f={hud.them} side="them" />
          </div>
          <div className="pointer-events-none flex flex-1 items-center justify-center px-4">
            {hud.bannerOn ? (
              <p
                aria-live="polite"
                className={`font-display text-3xl tracking-widest sm:text-5xl ${
                  hud.bannerTone === "good" || hud.bannerTone === "peel"
                    ? "text-primary"
                    : hud.bannerTone === "bad"
                      ? "text-blood"
                      : "text-fg"
                }`}
              >
                {hud.banner}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 p-2 sm:p-3">
            <div
              aria-live="polite"
              className="max-h-10 overflow-hidden border border-primary/20 bg-bg/80 px-3 py-1.5 text-xs leading-snug sm:max-h-24 sm:py-2 sm:text-sm"
            >
              {hud.log.length === 0 ? (
                <p className="text-muted">The sand is quiet. Shout.</p>
              ) : (
                hud.log.map((line) => (
                  <p
                    key={line.id}
                    className={
                      line.tone === "good" || line.tone === "peel"
                        ? "text-primary"
                        : line.tone === "bad"
                          ? "text-blood"
                          : "text-fg"
                    }
                  >
                    {line.text}
                  </p>
                ))
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SHOUTS.map((shout) => {
                const on = hud.queued === shout.id;
                const Icon = shout.icon;
                return (
                  <button
                    key={shout.id}
                    type="button"
                    data-testid={`shout-${shout.id}`}
                    onClick={() => onShout(shout.id)}
                    className={`flex min-h-12 flex-col items-center justify-center gap-0.5 border px-2 py-1.5 text-sm font-semibold sm:min-h-14 sm:text-base ${
                      on ? "border-primary bg-primary text-bg" : "border-primary/30 bg-surface text-fg"
                    }`}
                  >
                    <Icon className="size-5" aria-hidden />
                    <span>{shout.label}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              data-testid="throw-peel"
              disabled={hud.peel !== "ready"}
              onClick={onPeel}
              className="flex min-h-12 items-center justify-center gap-2 bg-primary px-3 py-2 font-semibold text-bg disabled:bg-surface disabled:text-muted"
            >
              <Citrus className="size-5" aria-hidden />
              {hud.peel === "ready"
                ? "Throw the peel"
                : hud.peel === "flying"
                  ? "Peel in the air"
                  : "Peel is on the sand"}
            </button>
            <div className="flex items-center gap-2">
              <p className="min-w-0 flex-1 text-xs leading-snug text-muted sm:text-sm">
                {hud.you.dizzy
                  ? `Dizzy. He hears about ${pct}% of shouts, and what he does is half.`
                  : hud.spam > 0
                    ? `You talked over yourself. Listen chance ${pct}%.`
                    : `Shout and he listens about ${pct}% of the time.`}
                <span className="hidden sm:inline"> Keys 1, 2, 3, B.</span>
              </p>
              {muteBtn}
            </div>
          </div>
        </>
      ) : (
        <div className="pointer-events-none flex flex-1 items-end justify-center p-3">
          <div className="pointer-events-auto max-h-full w-full max-w-md overflow-y-auto border border-primary/35 bg-surface px-5 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs tracking-widest text-primary">THE FRONT SEAT</p>
              {muteBtn}
            </div>
            <h1 className="mt-1 font-display text-3xl leading-none text-fg sm:text-4xl">From the Rail</h1>
            {hud.phase === "ready" ? (
              <>
                <p className="mt-2 text-sm leading-relaxed text-fg sm:text-base">
                  Lysander strikes, shields, or circles on his own. A shout lands only if he listens.
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted sm:hidden">
                  No stamina sticks him and halves every action. One peel. No health ends it. Both at none is a draw.
                </p>
                <ul className="mt-3 hidden flex-col gap-1.5 text-sm leading-relaxed text-muted sm:flex">
                  <li>No stamina: he sticks, goes dizzy, and every action is half.</li>
                  <li>One banana peel a bout. It does not care whose feet it finds.</li>
                  <li>No health ends it. Both at none is a draw.</li>
                </ul>
              </>
            ) : (
              <>
                <p className="mt-4 font-display text-3xl text-fg">
                  {hud.result === "win"
                    ? "The sand is yours."
                    : hud.result === "loss"
                      ? "The house takes it."
                      : "Both down. A draw."}
                </p>
                <p className="mt-2 text-sm text-muted">
                  Lysander {Math.round(hud.you.hp)} health · Corvus {Math.round(hud.them.hp)} health
                </p>
              </>
            )}
            <p className="mt-4 text-sm tabular-nums text-muted">
              Record {record.wins}–{record.losses}–{record.draws}
            </p>
            {hud.phase === "ready" ? (
              <button
                type="button"
                data-testid="start-bout"
                onClick={onStart}
                className="mt-5 min-h-12 w-full bg-primary px-4 py-3 font-semibold text-bg"
              >
                Take the front seat
              </button>
            ) : (
              <button
                type="button"
                data-testid="again"
                onClick={onAgain}
                className="mt-5 min-h-12 w-full bg-primary px-4 py-3 font-semibold text-bg"
              >
                Another bout
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
