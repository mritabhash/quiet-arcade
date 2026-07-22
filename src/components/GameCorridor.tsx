import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import type { GameMeta } from "../types";

/**
 * The Cave of Doors — a first-person walk through a branching arcane cavern.
 * Scrolling walks you deeper: the camera rides a winding rock tunnel with a
 * real footstep bob (sway + bounce per stride) rather than a glassy glide, so
 * it reads as *someone walking*. The games hang as rune-lit wooden doors set
 * into branch mouths off the main vein; you walk up to one and **open it**
 * (a click swings it wide with a glow flare) rather than passing through.
 *
 * Robustness: the camera always sits on the tube's centre-line, so the walk
 * bob (kept smaller than the tube radius) can never clip into the rock. Fog +
 * near-darkness hide both ends. Only a few lights ever exist. Reduced-motion /
 * no-WebGL callers should render the list instead.
 */

const BASE = import.meta.env.BASE_URL;

const SEG = 5.0; // arc-spacing between doors along the path
const TUBE_R = 3.3; // cave radius
const EYE_Y = 1.6; // centre-line height in world space
const DOOR_W = 2.0;
const DOOR_H = 2.9;
const STRIDE = 1.7; // metres per stride (two steps) — sets the bob cadence

type Theme = {
  bg: number;
  ambient: number;
  ambientI: number;
  hemiSky: number;
  hemiGround: number;
  hemiI: number;
  lantern: number;
  lanternI: number;
  rockTint: number;
  back: number;
  halo: number;
  emissive: number;
  mote: number;
  fogNear: number;
  fogFar: number;
};

const THEMES: Record<"dark" | "light", Theme> = {
  dark: {
    bg: 0x0a0810,
    ambient: 0x241f38,
    ambientI: 0.26,
    hemiSky: 0x2a2444,
    hemiGround: 0x070510,
    hemiI: 0.24,
    lantern: 0xffc888,
    lanternI: 1.5,
    rockTint: 0x5a5470,
    back: 0x8fd0d8,
    halo: 0xe9c06a,
    emissive: 1.1,
    mote: 0xe8c070,
    fogNear: 2.2,
    fogFar: 16,
  },
  light: {
    bg: 0x14111c,
    ambient: 0x3b3550,
    ambientI: 0.42,
    hemiSky: 0x6b6488,
    hemiGround: 0x2a2438,
    hemiI: 0.4,
    lantern: 0xfff0d2,
    lanternI: 1.35,
    rockTint: 0x9a8e74,
    back: 0xe7c07a,
    halo: 0xf0d089,
    emissive: 0.72,
    mote: 0xf1e2c0,
    fogNear: 2.6,
    fogFar: 21,
  },
};

/** glow-bright versions of the four game accents, for door light-spill */
const ACCENT_GLOW: Record<string, number> = {
  clay: 0xe0764a,
  sage: 0x6ec695,
  teal: 0x4fc3d6,
  gold: 0xf0b545,
};
const hex = (c: number) => `#${c.toString(16).padStart(6, "0")}`;

export interface GameCorridorProps {
  games: GameMeta[];
  dark: boolean;
  onEnter: (id: string) => void;
  onFocusChange?: (meta: GameMeta | null) => void;
  /** the corridor stores its door-opener here so the HUD button can call it */
  openRef?: React.MutableRefObject<((id: string) => void) | null>;
}

function makeHaloTexture(): THREE.CanvasTexture {
  const s = 256;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.25, "rgba(255,238,200,0.55)");
  g.addColorStop(0.55, "rgba(150,210,215,0.22)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Key the flat corner background of a door PNG out to alpha. */
function makeDoorCutout(url: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 8;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, img.width, img.height);
    const p = data.data;
    const br = p[0];
    const bg = p[1];
    const bb = p[2];
    const T0 = 42;
    const T1 = 95;
    for (let i = 0; i < p.length; i += 4) {
      const dr = p[i] - br;
      const dg = p[i + 1] - bg;
      const db = p[i + 2] - bb;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);
      let a = (dist - T0) / (T1 - T0);
      a = a < 0 ? 0 : a > 1 ? 1 : a;
      p[i + 3] = Math.round(a * 255);
    }
    ctx.putImageData(data, 0, 0);
    tex.needsUpdate = true;
  };
  img.src = url;
  return tex;
}

export function GameCorridor({ games, dark, onEnter, onFocusChange, openRef }: GameCorridorProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const reticleRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const onEnterRef = useRef(onEnter);
  const onFocusRef = useRef(onFocusChange);
  onEnterRef.current = onEnter;
  onFocusRef.current = onFocusChange;

  useEffect(() => {
    const mount = mountRef.current;
    const spacer = spacerRef.current;
    if (!mount || !spacer) return;

    const theme = THEMES[dark ? "dark" : "light"];
    const themeName = dark ? "dark" : "light";
    const isMobile = window.matchMedia("(max-width: 640px)").matches;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(theme.bg);
    scene.fog = new THREE.Fog(theme.bg, theme.fogNear, theme.fogFar);

    const camera = new THREE.PerspectiveCamera(
      isMobile ? 78 : 70,
      mount.clientWidth / Math.max(1, mount.clientHeight),
      0.1,
      60,
    );

    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(theme.bg, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const disposables: { dispose(): void }[] = [];
    const track = <T extends { dispose(): void }>(o: T): T => {
      disposables.push(o);
      return o;
    };

    const loader = new THREE.TextureLoader();
    // cave rock; fall back to the dressed-stone wall if the cave art isn't in yet
    const rockTex = loader.load(
      `${BASE}corridor/${themeName}-cave.png`,
      undefined,
      undefined,
      () => {
        rockTex.image = undefined as unknown as HTMLImageElement;
        const fb = loader.load(`${BASE}corridor/${themeName}-wall.png`);
        fb.colorSpace = THREE.SRGBColorSpace;
        fb.wrapS = fb.wrapT = THREE.RepeatWrapping;
        fb.repeat.set(10, 3);
        rockMat.map = fb;
        rockMat.needsUpdate = true;
        track(fb);
      },
    );
    rockTex.colorSpace = THREE.SRGBColorSpace;
    rockTex.wrapS = rockTex.wrapT = THREE.RepeatWrapping;
    rockTex.repeat.set(10, 3);
    track(rockTex);

    const n = games.length;

    // ---- winding cave path ---------------------------------------------------
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= n + 2; i++) {
      pts.push(
        new THREE.Vector3(
          Math.sin(i * 0.62) * 2.3 + Math.sin(i * 0.27) * 1.1,
          EYE_Y + Math.sin(i * 0.85) * 0.55,
          -i * SEG,
        ),
      );
    }
    const path = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5);
    const pathLen = path.getLength();

    // ---- cave tube (craggy rock, seen from inside) --------------------------
    const rockMat = track(
      new THREE.MeshStandardMaterial({
        map: rockTex,
        roughness: 1,
        metalness: 0.02,
        side: THREE.BackSide,
        color: new THREE.Color(theme.rockTint),
      }),
    );
    const tubeGeo = track(new THREE.TubeGeometry(path, (n + 2) * 10, TUBE_R, isMobile ? 14 : 18, false));
    // rough the walls up so it reads as rock, not a smooth pipe
    {
      const posAttr = tubeGeo.getAttribute("position") as THREE.BufferAttribute;
      const v = new THREE.Vector3();
      for (let i = 0; i < posAttr.count; i++) {
        v.fromBufferAttribute(posAttr, i);
        const nse =
          Math.sin(v.x * 1.7 + v.z * 0.9) * 0.18 +
          Math.sin(v.y * 2.3 + v.z * 1.3) * 0.12 +
          Math.sin(v.z * 3.1) * 0.08;
        // push along the radial from the nearest centre point (approx: xy only)
        const len = Math.hypot(v.x - 0, v.y - EYE_Y) || 1;
        v.x += ((v.x - 0) / len) * nse;
        v.y += ((v.y - EYE_Y) / len) * nse;
        posAttr.setXYZ(i, v.x, v.y, v.z);
      }
      posAttr.needsUpdate = true;
      tubeGeo.computeVertexNormals();
    }
    scene.add(new THREE.Mesh(tubeGeo, rockMat));

    // ---- branch alcoves + doors ---------------------------------------------
    const doorTex = track(makeDoorCutout(`${BASE}corridor/${themeName}-door.png`));
    const haloTex = track(makeHaloTexture());
    const doorGeo = track(new THREE.PlaneGeometry(DOOR_W, DOOR_H));
    const haloGeo = track(new THREE.PlaneGeometry(DOOR_W * 2.2, DOOR_H * 1.8));
    const branchGeo = track(new THREE.CylinderGeometry(1.5, 1.9, 4.2, 14, 1, true));
    const up = new THREE.Vector3(0, 1, 0);

    type Door = {
      group: THREE.Group;
      mesh: THREE.Mesh;
      mat: THREE.MeshStandardMaterial;
      halo: THREE.Mesh;
      haloMat: THREE.MeshBasicMaterial;
      baseQuat: THREE.Quaternion;
      u: number;
      pos: THREE.Vector3;
      meta: GameMeta;
      open: number; // 0..1 animation
      opening: boolean;
    };
    const doors: Door[] = [];
    const doorMeshes: THREE.Mesh[] = [];

    games.forEach((meta, i) => {
      const u = (i + 1) / (n + 2);
      const center = path.getPointAt(u);
      const tan = path.getTangentAt(u).normalize();
      const right = new THREE.Vector3().crossVectors(up, tan).normalize();
      const side = i % 2 === 0 ? 1 : -1;
      const outDir = right.clone().multiplyScalar(side);

      // a short rock branch boring out of the wall
      const branchMat = rockMat;
      const branch = new THREE.Mesh(branchGeo, branchMat);
      const branchPos = center.clone().addScaledVector(outDir, TUBE_R * 0.9);
      branch.position.copy(branchPos);
      // orient cylinder (default +Y axis) to lie along outDir
      branch.quaternion.setFromUnitVectors(up, outDir);
      scene.add(branch);

      // the door, standing in the branch mouth, facing back toward the path
      const doorPos = center.clone().addScaledVector(outDir, TUBE_R * 0.62);
      doorPos.y = EYE_Y - 0.15;

      const group = new THREE.Group();
      group.position.copy(doorPos);
      const facing = center.clone();
      facing.y = doorPos.y;
      group.lookAt(facing);
      const baseQuat = group.quaternion.clone();

      const haloMat = new THREE.MeshBasicMaterial({
        map: haloTex,
        color: new THREE.Color(theme.halo),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      });
      track(haloMat);
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.position.set(0, 0.1, -0.2);
      group.add(halo);

      const mat = new THREE.MeshStandardMaterial({
        map: doorTex,
        emissive: new THREE.Color(0xffffff),
        emissiveMap: doorTex,
        emissiveIntensity: theme.emissive,
        roughness: 0.8,
        metalness: 0.05,
        transparent: true,
        alphaTest: 0.4,
        side: THREE.DoubleSide,
      });
      track(mat);
      // hinge on the left edge: shift the plane so the group origin is the hinge
      const mesh = new THREE.Mesh(doorGeo, mat);
      mesh.position.set(DOOR_W / 2, 0, 0);
      const hinge = new THREE.Group();
      hinge.position.set(-DOOR_W / 2, 0, 0);
      hinge.add(mesh);
      group.add(hinge);
      mesh.userData.id = meta.id;
      mesh.userData.hinge = hinge;

      scene.add(group);
      doors.push({ group, mesh, mat, halo, haloMat, baseQuat, u, pos: doorPos, meta, open: 0, opening: false });
      doorMeshes.push(mesh);
    });

    // ---- lighting ------------------------------------------------------------
    scene.add(new THREE.AmbientLight(theme.ambient, theme.ambientI));
    scene.add(new THREE.HemisphereLight(theme.hemiSky, theme.hemiGround, theme.hemiI));
    const lantern = new THREE.PointLight(theme.lantern, theme.lanternI, 10, 2);
    scene.add(lantern);
    const backLights = [0, 1, 2].map(() => {
      const l = new THREE.PointLight(theme.back, 0, 7, 2);
      scene.add(l);
      return l;
    });

    // ---- embers --------------------------------------------------------------
    const MOTES = isMobile ? 110 : 190;
    const moteGeo = track(new THREE.BufferGeometry());
    const mp = new Float32Array(MOTES * 3);
    const mv = new Float32Array(MOTES);
    const around = (u: number, r: number) => {
      const c = path.getPointAt(Math.min(0.999, Math.max(0.001, u)));
      const a = Math.random() * Math.PI * 2;
      return new THREE.Vector3(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r * 0.7, c.z);
    };
    for (let i = 0; i < MOTES; i++) {
      const p = around(Math.random(), Math.random() * TUBE_R * 0.8);
      mp[i * 3] = p.x;
      mp[i * 3 + 1] = p.y;
      mp[i * 3 + 2] = p.z;
      mv[i] = 0.04 + Math.random() * 0.13;
    }
    moteGeo.setAttribute("position", new THREE.BufferAttribute(mp, 3));
    const moteMat = track(
      new THREE.PointsMaterial({
        color: theme.mote,
        size: isMobile ? 0.055 : 0.05,
        transparent: true,
        opacity: dark ? 0.8 : 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    );
    scene.add(new THREE.Points(moteGeo, moteMat));

    // ---- dust burst (one pooled cloud, fired when a door opens) --------------
    const BURST = isMobile ? 44 : 80;
    const burstGeo = track(new THREE.BufferGeometry());
    const bp = new Float32Array(BURST * 3);
    const bvel = new Float32Array(BURST * 3);
    burstGeo.setAttribute("position", new THREE.BufferAttribute(bp, 3));
    const burstMat = track(
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: isMobile ? 0.09 : 0.075,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    );
    const burstPts = new THREE.Points(burstGeo, burstMat);
    burstPts.visible = false;
    scene.add(burstPts);
    let burstLife = 0; // seconds remaining
    const fireBurst = (at: THREE.Vector3, color: number) => {
      burstMat.color.setHex(color);
      const pos = burstGeo.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < BURST; i++) {
        const a = Math.random() * Math.PI * 2;
        const el = (Math.random() - 0.5) * Math.PI;
        const sp = 0.6 + Math.random() * 2.2;
        bvel[i * 3] = Math.cos(a) * Math.cos(el) * sp;
        bvel[i * 3 + 1] = Math.sin(el) * sp * 0.8 + 0.4;
        bvel[i * 3 + 2] = Math.sin(a) * Math.cos(el) * sp;
        pos.setXYZ(i, at.x, at.y, at.z);
      }
      pos.needsUpdate = true;
      burstLife = 1.1;
      burstPts.visible = true;
    };

    // ---- accent light that spills out of an opening door --------------------
    const spillLight = new THREE.PointLight(0xffffff, 0, 9, 2);
    scene.add(spillLight);

    // ---- scroll → progress ---------------------------------------------------
    spacer.style.height = `${(n + 2) * 82}vh`;
    let targetU = 0;
    let curU = 0;
    const readScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      targetU = Math.min(0.999, Math.max(0.001, window.scrollY / max));
    };
    readScroll();
    curU = targetU;

    // ---- open a door ---------------------------------------------------------
    let openingDoor: Door | null = null;
    let pullT = 0; // camera pull-through, 0..1, starts once the door is wide
    let burstFired = false;
    const openDoor = (id: string) => {
      const d = doors.find((x) => x.meta.id === id);
      if (d && !d.opening && !openingDoor) {
        d.opening = true;
        openingDoor = d;
      }
    };
    if (openRef) openRef.current = openDoor;

    // ---- interaction ---------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const centerNdc = new THREE.Vector2(0, 0);
    let reachDoor: Door | null = null; // door within reach + roughly ahead (drives reticle/prompt/keyboard)
    let hoverId: string | null = null;
    let downX = 0;
    let downY = 0;
    let downT = 0;
    const setNdc = (x: number, y: number) => {
      const r = renderer.domElement.getBoundingClientRect();
      ndc.x = ((x - r.left) / r.width) * 2 - 1;
      ndc.y = -((y - r.top) / r.height) * 2 + 1;
    };
    const pickDoor = (): Door | null => {
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(doorMeshes, false);
      if (!hits.length) return null;
      const d = doors.find((x) => x.mesh === hits[0].object) ?? null;
      return d && hits[0].distance < SEG * 2.2 ? d : null;
    };
    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
      downT = performance.now();
    };
    const onPointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 10 || performance.now() - downT > 600) return;
      setNdc(e.clientX, e.clientY);
      const d = pickDoor();
      if (d) openDoor(d.meta.id);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      setNdc(e.clientX, e.clientY);
      const d = pickDoor();
      const id = d ? d.meta.id : null;
      if (id !== hoverId) {
        hoverId = id;
        renderer.domElement.style.cursor = id ? "pointer" : "default";
      }
    };
    // keyboard: E / Enter opens the door you are facing (AAA + a11y convention)
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "e" && e.key !== "E" && e.key !== "Enter") return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (reachDoor) {
        e.preventDefault();
        openDoor(reachDoor.meta.id);
      }
    };
    const el = renderer.domElement;
    el.addEventListener("pointerdown", onPointerDown, { passive: true });
    el.addEventListener("pointerup", onPointerUp, { passive: true });
    el.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("keydown", onKey);

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      readScroll();
    };
    window.addEventListener("resize", onResize);

    // ---- render loop ---------------------------------------------------------
    let raf = 0;
    let last = performance.now();
    let lastFocus: string | null | undefined = undefined;
    let moveAmp = 0;
    let entered = false;
    const clock = new THREE.Clock();
    const camQuat = new THREE.Quaternion();
    const rightV = new THREE.Vector3();
    const upV = new THREE.Vector3();
    const fwdV = new THREE.Vector3();
    const camPos = new THREE.Vector3();
    const lookPos = new THREE.Vector3();

    const frame = () => {
      raf = requestAnimationFrame(frame);
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = clock.getElapsedTime();

      const prevU = curU;
      curU += (targetU - curU) * Math.min(1, dt * 9); // tight tracking, bob adds the texture
      const du = Math.abs(curU - prevU);
      const speed = du / Math.max(dt, 0.001);
      moveAmp += (Math.min(1, speed * 22) - moveAmp) * Math.min(1, dt * 8);

      // base position + heading from the winding path
      path.getPointAt(curU, camPos);
      path.getPointAt(Math.min(0.999, curU + 0.012), lookPos);
      fwdV.copy(lookPos).sub(camPos).normalize();
      rightV.crossVectors(up, fwdV).normalize();
      upV.crossVectors(fwdV, rightV).normalize();

      // footstep bob — advances with distance walked, so it's a real gait
      const dist = curU * pathLen;
      const strideT = dist / STRIDE;
      const bobY = Math.sin(strideT * Math.PI * 2 * 2) * 0.06 * moveAmp;
      const swayX = Math.sin(strideT * Math.PI * 2) * 0.07 * moveAmp;
      const roll = Math.sin(strideT * Math.PI * 2) * 0.014 * moveAmp;

      camPos.addScaledVector(rightV, swayX).addScaledVector(upV, bobY);
      camera.position.copy(camPos);
      lookPos.addScaledVector(rightV, swayX * 0.3);
      camera.up.copy(upV);
      camera.lookAt(lookPos);
      camera.rotateZ(roll);
      camera.getWorldQuaternion(camQuat);

      const flick = 0.82 + Math.sin(t * 6.7) * 0.09 + Math.sin(t * 11.3) * 0.05;
      lantern.position.copy(camPos).addScaledVector(upV, 0.3).addScaledVector(fwdV, 0.3);
      lantern.intensity = theme.lanternI * (0.9 + Math.sin(t * 5.9) * 0.06);

      const ranked = doors
        .map((d) => ({ d, dist: Math.abs(d.u - curU) * pathLen }))
        .sort((a, b) => a.dist - b.dist);

      backLights.forEach((l, i) => {
        const r = ranked[i];
        if (!r) {
          l.intensity = 0;
          return;
        }
        const near = Math.max(0, 1 - r.dist / (SEG * 2));
        l.position.copy(r.d.pos);
        l.intensity = near * (dark ? 3.0 : 1.8) * flick;
      });

      // aim: which door does the centre of the view fall on?
      raycaster.setFromCamera(centerNdc, camera);
      const centerHits = raycaster.intersectObjects(doorMeshes, false);
      const aimedDoor =
        centerHits.length && centerHits[0].distance < SEG * 2.4
          ? doors.find((x) => x.mesh === centerHits[0].object) ?? null
          : null;

      // reach: nearest door close enough to open (aim wins, else proximity)
      const nearest = ranked[0];
      reachDoor =
        aimedDoor ??
        (nearest && nearest.dist < SEG * 1.5 ? nearest.d : null);
      const aimHit = aimedDoor != null;

      for (const { d, dist: dd } of ranked) {
        const near = Math.max(0, 1 - dd / (SEG * 2.4));
        const pulse = 0.8 + Math.sin(t * 1.5 + d.u * 40) * 0.2;
        const highlight = d === reachDoor ? 0.9 : 0; // aim/reach brightens the target
        d.mat.emissiveIntensity =
          theme.emissive * (0.5 + near * 1.0 + highlight) * pulse * flick * (1 + d.open * 1.7);
        d.halo.quaternion.copy(camQuat);
        d.haloMat.opacity = Math.max(0, near * near) * (dark ? 0.9 : 0.6) + highlight * 0.3 + d.open * 0.6;
        d.halo.scale.setScalar(0.9 + near * 0.35 + highlight * 0.15 + d.open * 0.6);
      }

      // ---- cinematic open sequence -----------------------------------------
      if (openingDoor) {
        const d = openingDoor;
        const accent = ACCENT_GLOW[d.meta.accent] ?? theme.halo;
        const hinge = d.mesh.userData.hinge as THREE.Group;
        if (!burstFired) {
          burstFired = true;
          fireBurst(d.pos, accent); // dust bursts the instant it cracks open
        }
        if (d.open < 1) {
          // ease-out swing so it lands with weight
          d.open = Math.min(1, d.open + dt / 0.85);
          const e = 1 - Math.pow(1 - d.open, 3);
          hinge.rotation.y = -e * 1.95;
        }
        // accent light floods out from behind the door, growing as it opens
        spillLight.color.setHex(accent);
        spillLight.position.copy(d.pos);
        spillLight.intensity = d.open * (dark ? 6 : 4) * flick;
        // once wide, pull the camera through the doorway and fade to the accent
        if (d.open >= 0.75) {
          pullT = Math.min(1, pullT + dt / 0.7);
          const pe = pullT * pullT;
          camera.position.lerp(d.pos, pe * 0.55);
          camera.lookAt(d.pos);
          camera.fov = (isMobile ? 78 : 70) - pe * 14;
          camera.updateProjectionMatrix();
          if (fadeRef.current) {
            fadeRef.current.style.background = hex(accent);
            fadeRef.current.style.opacity = String(Math.max(0, pe * 1.15 - 0.15));
          }
          if (pullT >= 1 && !entered) {
            entered = true;
            onEnterRef.current(d.meta.id);
          }
        }
      }

      // ---- dust burst physics ----------------------------------------------
      if (burstLife > 0) {
        burstLife -= dt;
        const bpos = burstGeo.getAttribute("position") as THREE.BufferAttribute;
        for (let i = 0; i < BURST; i++) {
          bvel[i * 3 + 1] -= 1.4 * dt; // gravity
          bpos.setXYZ(
            i,
            bpos.getX(i) + bvel[i * 3] * dt,
            bpos.getY(i) + bvel[i * 3 + 1] * dt,
            bpos.getZ(i) + bvel[i * 3 + 2] * dt,
          );
        }
        bpos.needsUpdate = true;
        burstMat.opacity = Math.max(0, burstLife / 1.1) * 0.85;
        if (burstLife <= 0) burstPts.visible = false;
      }

      // reticle + proximity prompt (imperative — no React re-render per frame)
      if (reticleRef.current) {
        const on = reachDoor != null;
        reticleRef.current.dataset.active = on ? (aimHit ? "aim" : "near") : "off";
      }
      if (promptRef.current) {
        promptRef.current.style.opacity = reachDoor && !openingDoor ? "1" : "0";
      }

      const focus = reachDoor ? reachDoor.meta.id : nearest && nearest.dist < SEG * 1.4 ? nearest.d.meta.id : null;
      if (focus !== lastFocus) {
        lastFocus = focus;
        const fd = doors.find((x) => x.meta.id === focus);
        onFocusRef.current?.(fd ? (fd.meta as GameMeta) : null);
      }

      const pos = moteGeo.getAttribute("position") as THREE.BufferAttribute;
      const near = path.getPointAt(curU);
      for (let i = 0; i < MOTES; i++) {
        let y = pos.getY(i) + mv[i] * dt;
        let z = pos.getZ(i);
        if (y > near.y + TUBE_R) {
          const np = around(Math.min(0.999, curU + Math.random() * 0.2), Math.random() * TUBE_R * 0.8);
          pos.setXYZ(i, np.x, near.y - TUBE_R + 0.2, np.z);
          continue;
        }
        if (z > near.z + 5 || z < near.z - 18) {
          const np = around(Math.min(0.999, curU + Math.random() * 0.25), Math.random() * TUBE_R * 0.8);
          pos.setXYZ(i, np.x, np.y, np.z);
          continue;
        }
        pos.setY(i, y);
        void z;
      }
      pos.needsUpdate = true;

      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      if (openRef) openRef.current = null;
      onFocusRef.current?.(null);
      for (const d of disposables) d.dispose();
      renderer.dispose();
      if (el.parentElement === mount) mount.removeChild(el);
    };
  }, [games, dark, openRef]);

  return (
    <>
      {createPortal(
        <div ref={mountRef} aria-hidden className="pointer-events-auto fixed inset-0 z-0 h-[100svh] w-full" />,
        document.body,
      )}
      {createPortal(
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[40]">
          <style>{`
            .qa-reticle{position:absolute;left:50%;top:50%;width:26px;height:26px;transform:translate(-50%,-50%);
              border-radius:9999px;border:1.5px solid rgba(255,255,255,.28);
              transition:width .25s ease,height .25s ease,border-color .25s ease,box-shadow .25s ease,opacity .25s ease;opacity:.5}
            .qa-reticle::after{content:"";position:absolute;left:50%;top:50%;width:3px;height:3px;border-radius:9999px;
              transform:translate(-50%,-50%);background:rgba(255,255,255,.6);transition:all .25s ease}
            .qa-reticle[data-active="near"]{width:34px;height:34px;border-color:rgba(240,200,120,.7);opacity:.85;
              box-shadow:0 0 14px rgba(240,200,120,.35)}
            .qa-reticle[data-active="aim"]{width:44px;height:44px;border-color:rgba(255,225,150,.95);opacity:1;
              box-shadow:0 0 22px rgba(255,215,130,.6)}
            .qa-reticle[data-active="aim"]::after{background:rgba(255,225,150,1);width:4px;height:4px;
              box-shadow:0 0 10px rgba(255,215,130,.9)}
            .qa-openprompt{position:absolute;left:50%;top:calc(50% - 52px);transform:translateX(-50%);
              display:flex;align-items:center;gap:.5rem;padding:.4rem .85rem;border-radius:9999px;
              font-size:12px;font-weight:600;letter-spacing:.02em;white-space:nowrap;
              color:#fff;background:rgba(20,16,26,.55);border:1px solid rgba(255,255,255,.16);
              backdrop-filter:blur(8px);opacity:0;transition:opacity .3s ease}
            .qa-kbd{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 4px;
              border-radius:5px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);
              font-size:11px;font-weight:700}
          `}</style>
          <div ref={reticleRef} className="qa-reticle" data-active="off" />
          <div ref={promptRef} className="qa-openprompt">
            <span className="hidden sm:inline">
              Press <span className="qa-kbd">E</span> to open
            </span>
            <span className="sm:hidden">Tap the door to open</span>
          </div>
        </div>,
        document.body,
      )}
      {createPortal(
        <div
          ref={fadeRef}
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[70]"
          style={{ background: "#000", opacity: 0, transition: "opacity .05s linear" }}
        />,
        document.body,
      )}
      <div ref={spacerRef} aria-hidden className="pointer-events-none w-full" />
    </>
  );
}
