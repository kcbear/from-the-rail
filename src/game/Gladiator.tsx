import { useLayoutEffect, useMemo, useRef } from "react";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import type { Fighter } from "@/game/sim";
import { palette } from "@/game/palette";

export type Rig = {
  root: Group;
  tilt: Group;
  body: Group;
  legL: Group;
  legR: Group;
  armL: Group;
  armR: Group;
  stars: Group;
  plume: Group;
  chest: Mesh;
};

function take(root: Group, name: string) {
  const obj = root.getObjectByName(name);
  if (!obj) throw new Error(`gladiator missing ${name}`);
  return obj;
}

export function captureRig(root: Group): Rig {
  return {
    root,
    tilt: take(root, "tilt") as Group,
    body: take(root, "body") as Group,
    legL: take(root, "legL") as Group,
    legR: take(root, "legR") as Group,
    armL: take(root, "armL") as Group,
    armR: take(root, "armR") as Group,
    stars: take(root, "stars") as Group,
    plume: take(root, "plume") as Group,
    chest: take(root, "chest") as Mesh,
  };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function pose(rig: Rig, f: Fighter, time: number, reduced: boolean) {
  const { root, tilt, body, legL, legR, armL, armR, stars, plume, chest } = rig;
  root.position.set(f.x, 0, f.z);
  root.rotation.set(0, f.yaw, 0);
  tilt.rotation.set(0, 0, 0);
  tilt.position.y = 0.92;
  body.rotation.set(0, 0, 0);
  body.position.set(0, -0.92, 0);
  stars.visible = f.dizzy && f.action !== "down";
  stars.rotation.y = reduced ? 0 : time * 2.4;
  plume.rotation.z = reduced ? 0 : Math.sin(time * 6 + f.x) * 0.12;

  const u = f.actionDur > 0 ? Math.min(1, f.actionT / f.actionDur) : 0;
  const pace = Math.max(1.6, f.speed * 3.2);
  const swing = reduced ? 0 : Math.sin(time * pace + (f.id === "you" ? 0 : 1.2)) * (f.speed > 0.35 ? 0.55 : 0.12);
  legL.rotation.set(swing, 0, 0);
  legR.rotation.set(-swing, 0, 0);
  armR.rotation.set(0.45, 0, -0.18);
  armL.rotation.set(0.35, 0, 0.35);

  if (f.action === "attack") {
    let slash = 0.5;
    if (u < 0.34) slash = lerp(0.45, 1.65, u / 0.34);
    else if (u < 0.5) slash = lerp(1.65, -1.2, (u - 0.34) / 0.16);
    else slash = lerp(-1.2, 0.4, (u - 0.5) / 0.5);
    armR.rotation.set(slash, 0.1, -0.15);
    body.rotation.x = u < 0.5 ? lerp(0, 0.32, u / 0.5) : lerp(0.32, 0.05, (u - 0.5) / 0.5);
    legL.rotation.x = -0.25;
    legR.rotation.x = 0.35;
  } else if (f.action === "defend") {
    armL.rotation.set(-1.25, 0.15, 0.45);
    armR.rotation.set(-0.2, 0, -0.4);
    body.rotation.x = -0.06;
  } else if (f.action === "flee") {
    body.rotation.x = 0.28;
    body.rotation.z = reduced ? 0 : Math.sin(time * 11) * 0.05;
    armR.rotation.set(0.8, 0, -0.5);
    armL.rotation.set(0.7, 0, 0.5);
  } else if (f.action === "slip") {
    const fall = Math.sin(Math.min(1, u) * Math.PI);
    tilt.rotation.z = fall * 1.15 * (f.id === "you" ? 1 : -1);
    body.rotation.x = 0.7;
    legL.rotation.x = 0.6;
    legR.rotation.x = -0.3;
    armR.rotation.x = 1.1;
    armL.rotation.x = 1.2;
  } else if (f.action === "down") {
    tilt.rotation.z = (f.id === "you" ? 1 : -1) * 1.28;
    tilt.position.y = 0.55;
    armR.rotation.x = 0.9;
    armL.rotation.x = 1.1;
    legL.rotation.x = 0.2;
    legR.rotation.x = -0.15;
  } else if (f.action === "win") {
    armR.rotation.set(-2.55, 0, 0.1);
    body.position.y = -0.92 + (reduced ? 0 : Math.sin(time * 2) * 0.03);
  } else if (f.dizzy) {
    tilt.rotation.z = reduced ? 0 : Math.sin(time * 8) * 0.1;
    tilt.rotation.x = reduced ? 0 : Math.cos(time * 6) * 0.05;
    body.position.y = -0.92;
  } else {
    body.position.y = -0.92 + (reduced ? 0 : Math.sin(time * 2.1 + f.z) * 0.025);
  }

  const mat = chest.material as MeshStandardMaterial;
  if (f.hitFlash > 0.04) {
    mat.emissive.set(palette.blood);
    mat.emissiveIntensity = f.hitFlash * 0.85;
  } else if (mat.emissiveIntensity !== 0) {
    mat.emissive.set("#000000");
    mat.emissiveIntensity = 0;
  }
}

function Mat({
  color,
  metal = 0.08,
  rough = 0.72,
}: {
  color: string;
  metal?: number;
  rough?: number;
}) {
  return <meshStandardMaterial color={color} metalness={metal} roughness={rough} flatShading />;
}

export function Gladiator({
  side,
  onRig,
}: {
  side: "you" | "them";
  onRig: (rig: Rig) => void;
}) {
  const root = useRef<Group>(null);
  const colors = useMemo(
    () =>
      side === "you"
        ? { cloth: palette.gold, plume: palette.gold, shield: palette.steel, trim: palette.bronze }
        : { cloth: palette.blood, plume: palette.blood, shield: palette.iron, trim: palette.stone },
    [side],
  );
  const skin = side === "you" ? palette.skin : palette.skinDeep;

  useLayoutEffect(() => {
    if (root.current) onRig(captureRig(root.current));
  }, [onRig]);

  return (
    <group ref={root}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.42, 14]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.28} />
      </mesh>
      <group name="tilt" position={[0, 0.92, 0]}>
        <group name="body" position={[0, -0.92, 0]}>
          <group name="legL" position={[-0.16, 0.9, 0]}>
            <mesh position={[0, -0.38, 0]} castShadow>
              <boxGeometry args={[0.18, 0.72, 0.18]} />
              <Mat color={skin} />
            </mesh>
            <mesh position={[0, -0.74, 0.06]} castShadow>
              <boxGeometry args={[0.2, 0.1, 0.28]} />
              <Mat color={palette.leather} rough={0.9} />
            </mesh>
          </group>
          <group name="legR" position={[0.16, 0.9, 0]}>
            <mesh position={[0, -0.38, 0]} castShadow>
              <boxGeometry args={[0.18, 0.72, 0.18]} />
              <Mat color={skin} />
            </mesh>
            <mesh position={[0, -0.74, 0.06]} castShadow>
              <boxGeometry args={[0.2, 0.1, 0.28]} />
              <Mat color={palette.leather} rough={0.9} />
            </mesh>
          </group>

          <mesh position={[0, 1.12, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.4, 0.42, 7]} />
            <Mat color={colors.cloth} rough={0.85} />
          </mesh>
          <mesh name="chest" position={[0, 1.42, 0.02]} castShadow>
            <boxGeometry args={[0.52, 0.4, 0.3]} />
            <Mat color={colors.trim} metal={0.35} rough={0.45} />
          </mesh>
          <mesh position={[0, 1.66, 0]} castShadow>
            <sphereGeometry args={[0.2, 8, 7]} />
            <Mat color={skin} />
          </mesh>
          <mesh position={[0, 1.74, 0]} castShadow>
            <sphereGeometry args={[0.23, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
            <Mat color={palette.steel} metal={0.55} rough={0.35} />
          </mesh>
          <group name="plume" position={[0, 1.92, -0.06]}>
            <mesh position={[0, 0.16, 0]} castShadow>
              <coneGeometry args={[0.07, 0.38, 5]} />
              <Mat color={colors.plume} rough={0.6} />
            </mesh>
            <mesh position={[0.07, 0.1, -0.02]} rotation={[0, 0, -0.35]}>
              <coneGeometry args={[0.05, 0.26, 5]} />
              <Mat color={colors.plume} rough={0.6} />
            </mesh>
          </group>

          <group name="armL" position={[-0.4, 1.46, 0]}>
            <mesh position={[0, -0.26, 0]} castShadow>
              <boxGeometry args={[0.14, 0.5, 0.14]} />
              <Mat color={skin} />
            </mesh>
            <mesh position={[-0.04, -0.46, 0.16]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.34, 0.34, 0.08, 8]} />
              <Mat color={colors.shield} metal={0.4} rough={0.4} />
            </mesh>
            <mesh position={[-0.04, -0.46, 0.16]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.34, 0.035, 6, 10]} />
              <Mat color={colors.cloth} metal={0.2} />
            </mesh>
          </group>

          <group name="armR" position={[0.4, 1.46, 0]}>
            <mesh position={[0, -0.24, 0]} castShadow>
              <boxGeometry args={[0.14, 0.46, 0.14]} />
              <Mat color={skin} />
            </mesh>
            <mesh position={[0, -0.46, 0.02]} castShadow>
              <boxGeometry args={[0.24, 0.05, 0.08]} />
              <Mat color={palette.gold} metal={0.45} rough={0.4} />
            </mesh>
            <mesh position={[0, -0.86, 0.02]} castShadow>
              <boxGeometry args={[0.07, 0.78, 0.035]} />
              <Mat color={palette.steel} metal={0.72} rough={0.28} />
            </mesh>
          </group>

          <group name="stars" position={[0, 2.25, 0]} visible={false}>
            <mesh position={[0.22, 0.08, 0]}>
              <octahedronGeometry args={[0.06, 0]} />
              <meshBasicMaterial color={palette.gold} />
            </mesh>
            <mesh position={[-0.16, 0.16, 0.06]}>
              <octahedronGeometry args={[0.05, 0]} />
              <meshBasicMaterial color={palette.gold} />
            </mesh>
            <mesh position={[0.02, 0.24, -0.08]}>
              <octahedronGeometry args={[0.045, 0]} />
              <meshBasicMaterial color={palette.parchment} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
