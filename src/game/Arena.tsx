import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import {
  CanvasTexture,
  Color,
  InstancedMesh,
  Object3D,
  RepeatWrapping,
  type Group,
} from "three";
import { palette } from "@/game/palette";
import {
  hudSignature,
  ingestInput,
  snapshot,
  step,
  type HudModel,
  type InputCmd,
  type Match,
} from "@/game/sim";
import { Gladiator, pose, type Rig } from "@/game/Gladiator";

const STEP = 1 / 60;
const CROWD = 72;

function makeGrain(base: string, speck: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const g = canvas.getContext("2d");
  if (!g) return null;
  g.fillStyle = base;
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 700; i++) {
    g.fillStyle = speck;
    g.globalAlpha = 0.18 + (i % 5) * 0.04;
    const s = 1 + (i % 3);
    g.fillRect((i * 47) % 128, (i * 19) % 128, s, s);
  }
  g.globalAlpha = 1;
  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(5, 5);
  return tex;
}

function Crowd({ reduced }: { reduced: boolean }) {
  const bodies = useRef<InstancedMesh>(null);
  const heads = useRef<InstancedMesh>(null);
  const seats = useMemo(() => {
    const list: { x: number; y: number; z: number; h: number; phase: number }[] = [];
    for (let i = 0; i < CROWD; i++) {
      const t = i / CROWD;
      const a = Math.PI * 1.12 + t * Math.PI * 0.76;
      const ring = i % 3;
      const r = 8.2 + ring * 0.58;
      list.push({
        x: Math.cos(a) * r,
        z: Math.sin(a) * r,
        y: 0.42 + ring * 0.16,
        h: 0.66 + (i % 5) * 0.07,
        phase: i * 0.65,
      });
    }
    return list;
  }, []);
  const colors = useMemo(
    () =>
      [palette.blood, palette.gold, palette.stone, palette.parchment, palette.iron, palette.bronze].map(
        (hex) => new Color(hex),
      ),
    [],
  );

  useLayoutEffect(() => {
    const body = bodies.current;
    const head = heads.current;
    if (!body || !head) return;
    const dummy = new Object3D();
    seats.forEach((seat, i) => {
      dummy.position.set(seat.x, seat.y + seat.h * 0.5, seat.z);
      dummy.rotation.set(0, Math.atan2(seat.x, seat.z), 0);
      dummy.scale.set(0.36, seat.h, 0.28);
      dummy.updateMatrix();
      body.setMatrixAt(i, dummy.matrix);
      body.setColorAt(i, colors[i % colors.length]);
      dummy.position.set(seat.x, seat.y + seat.h + 0.12, seat.z);
      dummy.scale.set(0.18, 0.18, 0.18);
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
      const bob = Math.sin(t * 1.7 + seat.phase) * 0.035;
      dummy.position.set(seat.x, seat.y + seat.h * 0.5 + bob, seat.z);
      dummy.rotation.set(0, Math.atan2(seat.x, seat.z), 0);
      dummy.scale.set(0.36, seat.h, 0.28);
      dummy.updateMatrix();
      body.setMatrixAt(i, dummy.matrix);
      dummy.position.set(seat.x, seat.y + seat.h + 0.12 + bob, seat.z);
      dummy.scale.set(0.18, 0.18, 0.18);
      dummy.updateMatrix();
      head.setMatrixAt(i, dummy.matrix);
    }
    body.instanceMatrix.needsUpdate = true;
    head.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={bodies} args={[undefined, undefined, CROWD]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, CROWD]}>
        <sphereGeometry args={[1, 6, 5]} />
        <meshStandardMaterial roughness={0.8} flatShading />
      </instancedMesh>
    </group>
  );
}

const crowdDummy = new Object3D();

function Wall() {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new Object3D();
    const color = new Color(palette.stone);
    const dark = new Color(palette.stoneDark);
    const count = 32;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = 7.05;
      dummy.position.set(Math.cos(a) * r, 0.68, Math.sin(a) * r);
      dummy.rotation.set(0, -a, 0);
      dummy.scale.set(1.55, 1.36, 0.48);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, i % 3 === 0 ? dark : color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 32]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.92} />
    </instancedMesh>
  );
}

function Torch({ position }: { position: [number, number, number] }) {
  const fire = useRef<Group>(null);
  useFrame(({ clock }) => {
    const mesh = fire.current;
    if (!mesh) return;
    const s = 1 + Math.sin(clock.elapsedTime * 14 + position[0] * 2) * 0.12;
    mesh.scale.set(s, 0.85 + s * 0.3, s);
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 1.15, 6]} />
        <meshStandardMaterial color={palette.wood} roughness={0.85} />
      </mesh>
      <group ref={fire} position={[0, 1.22, 0]}>
        <mesh>
          <coneGeometry args={[0.12, 0.42, 6]} />
          <meshStandardMaterial
            color={palette.flame}
            emissive={palette.flame}
            emissiveIntensity={1.5}
            flatShading
          />
        </mesh>
      </group>
    </group>
  );
}

export function Arena({
  sim,
  input,
  onHud,
  reduced,
}: {
  sim: React.RefObject<Match>;
  input: React.RefObject<InputCmd>;
  onHud: (hud: HudModel) => void;
  reduced: boolean;
}) {
  const youRig = useRef<Rig | null>(null);
  const themRig = useRef<Rig | null>(null);
  const peelRef = useRef<Group>(null);
  const acc = useRef(0);
  const sig = useRef("");
  const takeYou = useCallback((rig: Rig) => {
    youRig.current = rig;
  }, []);
  const takeThem = useCallback((rig: Rig) => {
    themRig.current = rig;
  }, []);
  const sand = useMemo(() => makeGrain(palette.sand, palette.sandDark), []);
  const camera = useThree((s) => s.camera);

  useFrame((_, raw) => {
    const m = sim.current;
    const cmd = input.current;
    if (!m || !cmd) return;
    const dt = Math.min(raw, 0.1);
    ingestInput(m, cmd);
    if (m.phase === "fight") {
      acc.current = Math.min(0.25, acc.current + dt);
      let guard = 0;
      while (acc.current >= STEP && guard < 8) {
        acc.current -= STEP;
        step(m, STEP);
        guard += 1;
      }
    } else if (m.phase === "end") {
      step(m, dt);
    }
    const time = m.t;
    if (youRig.current) pose(youRig.current, m.you, time, reduced);
    if (themRig.current) pose(themRig.current, m.them, time, reduced);
    const peel = peelRef.current;
    if (peel) {
      peel.position.set(m.peel.x, m.peel.y, m.peel.z);
      peel.rotation.x = m.peel.status === "down" ? 1.2 : 0.6;
      peel.rotation.z = m.peel.status === "flying" ? time * 9 : 0.4;
      peel.rotation.y = time * 0.4;
    }
    const shake = reduced ? 0 : m.shake;
    camera.position.set(
      Math.sin(time * 32) * shake * 0.18,
      3.7 + Math.cos(time * 27) * shake * 0.08,
      9.6,
    );
    camera.lookAt(0, 0.4, 0);
    const hud = snapshot(m);
    const next = hudSignature(hud);
    if (next !== sig.current) {
      sig.current = next;
      onHud(hud);
    }
  });

  return (
    <>
      <color attach="background" args={[palette.bg]} />
      <fog attach="fog" args={[palette.bg, 16, 30]} />
      <hemisphereLight args={[palette.sun, palette.ground, 0.72]} />
      <ambientLight intensity={0.22} />
      <directionalLight
        position={[5.5, 12, 6]}
        intensity={1.7}
        color={palette.sun}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={2}
        shadow-camera-far={28}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0006}
      />
      <pointLight position={[-4.2, 2.4, 2]} color={palette.flame} intensity={6} distance={12} decay={2} />
      <pointLight position={[4.2, 2.4, -1]} color={palette.flame} intensity={5} distance={11} decay={2} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
        <circleGeometry args={[24, 40]} />
        <meshStandardMaterial color={palette.ground} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[6.55, 56]} />
        <meshStandardMaterial map={sand ?? undefined} color={palette.sand} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <ringGeometry args={[6.15, 6.7, 48]} />
        <meshStandardMaterial color={palette.stoneDark} roughness={1} />
      </mesh>

      <Wall />
      <Crowd reduced={reduced} />
      <Torch position={[-5.4, 0, 3.2]} />
      <Torch position={[5.4, 0, 3.2]} />
      <Torch position={[-3.6, 0, -5.1]} />
      <Torch position={[3.6, 0, -5.1]} />

      <mesh position={[0, 1.12, 8.85]} castShadow>
        <boxGeometry args={[6.4, 0.12, 0.16]} />
        <meshStandardMaterial color={palette.wood} roughness={0.84} />
      </mesh>
      <mesh position={[-3.05, 0.58, 8.85]} castShadow>
        <boxGeometry args={[0.14, 1.16, 0.14]} />
        <meshStandardMaterial color={palette.wood} roughness={0.84} />
      </mesh>
      <mesh position={[3.05, 0.58, 8.85]} castShadow>
        <boxGeometry args={[0.14, 1.16, 0.14]} />
        <meshStandardMaterial color={palette.wood} roughness={0.84} />
      </mesh>
      <mesh position={[-1.35, 1.28, 8.55]}>
        <cylinderGeometry args={[0.1, 0.08, 0.18, 8]} />
        <meshStandardMaterial color={palette.blood} roughness={0.55} />
      </mesh>

      <group ref={peelRef}>
        <mesh rotation={[0.4, 0, 0.2]} castShadow>
          <torusGeometry args={[0.2, 0.065, 6, 12, Math.PI * 1.25]} />
          <meshStandardMaterial color={palette.peel} roughness={0.45} flatShading />
        </mesh>
        <mesh position={[0.16, 0.02, 0]}>
          <sphereGeometry args={[0.045, 6, 6]} />
          <meshStandardMaterial color={palette.stem} roughness={0.7} />
        </mesh>
      </group>

      <Gladiator side="you" onRig={takeYou} />
      <Gladiator side="them" onRig={takeThem} />
      <ContactShadows position={[0, 0.02, 0]} opacity={0.45} scale={16} blur={2.4} far={3.5} />
    </>
  );
}
