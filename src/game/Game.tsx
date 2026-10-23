import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping } from "three";
import { Arena } from "@/game/Arena";
import { Hud } from "@/game/Hud";
import { playEnd, playHit, playShout, playSlip, resumeAudio, setMuted, unlockAudio } from "@/game/audio";
import {
  createMatch,
  snapshot,
  type Action,
  type HudModel,
  type InputCmd,
  type Match,
} from "@/game/sim";

const RECORD_KEY = "from-the-rail-v1";

type Record = { wins: number; losses: number; draws: number };

function emptyRecord(): Record {
  return { wins: 0, losses: 0, draws: 0 };
}

function loadRecord(): Record {
  if (typeof window === "undefined") return emptyRecord();
  try {
    const raw = localStorage.getItem(RECORD_KEY);
    if (!raw) return emptyRecord();
    const parsed = JSON.parse(raw) as Partial<Record>;
    if (
      typeof parsed.wins !== "number" ||
      typeof parsed.losses !== "number" ||
      typeof parsed.draws !== "number"
    ) {
      return emptyRecord();
    }
    return { wins: parsed.wins, losses: parsed.losses, draws: parsed.draws };
  } catch {
    return emptyRecord();
  }
}

export function Game() {
  const sim = useRef<Match>(createMatch());
  const input = useRef<InputCmd>({ serial: 0, command: null, peel: false, spam: 0 });
  const [hud, setHud] = useState<HudModel>(() => snapshot(sim.current));
  const [live, setLive] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [record, setRecord] = useState<Record>(emptyRecord);
  const saved = useRef(false);
  const heard = useRef(0);
  const mutedRef = useRef(false);
  mutedRef.current = muted;

  useEffect(() => {
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

  useEffect(() => {
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

  useEffect(() => {
    const line = hud.log[0];
    if (!line || line.id === heard.current) return;
    heard.current = line.id;
    if (line.text.includes("lands") || line.text.includes("blocks")) playHit();
    else if (line.text.includes("hits the peel") || line.text.includes("finds the peel")) playSlip();
    else if (line.text.includes("drops") || line.text.includes("calls a draw")) playEnd();
  }, [hud.log]);

  const onHud = useCallback((next: HudModel) => {
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

  function shout(action: Action) {
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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
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
    // Handlers close over refs and the match object, not render state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="relative h-dvh overflow-hidden bg-bg text-fg">
      {live ? (
        <div className="absolute inset-0">
          <Canvas
            shadows
            dpr={[1, 1.6]}
            camera={{ position: [0, 3.7, 9.6], fov: 40, near: 0.1, far: 42 }}
            gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
          >
            <Arena sim={sim} input={input} onHud={onHud} reduced={reduced} />
          </Canvas>
        </div>
      ) : null}
      <div className="pit-vignette pointer-events-none absolute inset-0" />
      <Hud
        hud={hud}
        muted={muted}
        record={record}
        onStart={start}
        onAgain={again}
        onShout={shout}
        onPeel={peel}
        onMute={toggleMute}
      />
    </main>
  );
}
