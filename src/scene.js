import * as T from "three";
import { Sky } from "three/addons/objects/Sky.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import {
  MAPS,
  WEAPONS,
  BOOST_PADS,
  BARREL_POSITIONS,
  REPAIR_POSITIONS,
  angleDiff,
} from "../shared/game.js";
import { Effects } from "./effects.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const mat = (color, roughness = 0.7, metalness = 0) =>
  new T.MeshStandardMaterial({ color, roughness, metalness });
const vec = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
function mesh(g, m, parent, x = 0, y = 0, z = 0) {
  const o = new T.Mesh(g, m);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}
const box = (p, m, w, h, d, x = 0, y = 0, z = 0, round = 0) =>
  mesh(
    round
      ? new RoundedBoxGeometry(w, h, d, 2, round)
      : new T.BoxGeometry(w, h, d),
    m,
    p,
    x,
    y,
    z,
  );
function tube(p, m, a, b, r = 0.05) {
  const start = vec(...a),
    end = vec(...b),
    delta = end.clone().sub(start);
  const o = mesh(new T.CylinderGeometry(r, r, delta.length(), 8), m, p);
  o.position.copy(start.add(end).multiplyScalar(0.5));
  o.quaternion.setFromUnitVectors(vec(0, 1, 0), delta.normalize());
  return o;
}
function labelTexture(text, color = "#c4f564", bg = "#161b17") {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext("2d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "italic 900 76px Display,sans-serif";
  ctx.fillText(text, 256, 66);
  const tex = new T.CanvasTexture(c);
  tex.colorSpace = T.SRGBColorSpace;
  return tex;
}

export function makeKart(color, driver = false) {
  const g = new T.Group(),
    paint = new T.MeshPhysicalMaterial({
      color,
      metalness: 0.24,
      roughness: 0.37,
      clearcoat: 0.7,
      clearcoatRoughness: 0.25,
    });
  const black = mat("#141a19", 0.72, 0.15),
    metal = mat("#7e8686", 0.3, 0.9),
    rubber = mat("#171a19", 0.92),
    carbon = mat("#202924", 0.52, 0.4),
    red = mat("#b82a24", 0.4, 0.3);
  g.userData.paint = paint;
  g.userData.wheels = [];
  box(g, carbon, 1.68, 0.2, 3.05, 0, 0.53, 0, 0.08);
  const nose = box(g, paint, 1.35, 0.26, 1.17, 0, 0.72, 1.17, 0.1);
  nose.rotation.x = -0.12;
  box(g, carbon, 0.92, 0.04, 0.83, 0, 0.9, 1.15, 0.02);
  for (let i = 0; i < 6; i++)
    box(g, black, 0.62, 0.025, 0.035, 0, 0.932, 0.91 + i * 0.09);
  for (const side of [-1, 1]) {
    const pod = box(g, paint, 0.36, 0.33, 1.38, side * 0.87, 0.63, -0.05, 0.13);
    pod.rotation.z = side * -0.09;
    tube(g, paint, [side * 0.72, 0.65, 1.7], [side * 0.85, 0.7, -1.45], 0.07);
    tube(g, metal, [side * 0.6, 0.65, 0.88], [side * 1.35, 0.54, 1.06], 0.045);
    tube(g, metal, [side * 0.6, 0.38, 1.4], [side * 1.35, 0.54, 1.06], 0.045);
    tube(
      g,
      metal,
      [side * 0.6, 0.65, -0.95],
      [side * 1.35, 0.54, -1.05],
      0.045,
    );
    tube(
      g,
      paint,
      [side * 0.58, 0.61, -0.95],
      [side * 0.58, 1.95, -0.86],
      0.065,
    );
    tube(
      g,
      paint,
      [side * 0.58, 1.95, -0.86],
      [side * 0.45, 2.13, -0.88],
      0.065,
    );
    tube(g, black, [side * 0.5, 1.15, -1.34], [side * 0.9, 1.62, -1.62], 0.055);
    const lightMat = new T.MeshStandardMaterial({
      color: 0xffffdd,
      emissive: 0xffffdd,
      emissiveIntensity: 1.6,
    });
    box(g, black, 0.43, 0.2, 0.13, side * 0.63, 0.61, 1.85, 0.025);
    for (let j = 0; j < 4; j++)
      box(
        g,
        lightMat,
        0.065,
        0.08,
        0.02,
        side * 0.63 + (j - 1.5) * 0.082,
        0.63,
        1.93,
      );
    box(
      g,
      new T.MeshStandardMaterial({
        color: 0xff3333,
        emissive: 0xff2222,
        emissiveIntensity: 2,
      }),
      0.3,
      0.07,
      0.04,
      side * 0.6,
      0.73,
      -1.65,
    );
    for (const z of [1.09, -1.08]) {
      const pivot = new T.Group();
      pivot.position.set(side * 1.1, 0.52, z);
      g.add(pivot);
      const spin = new T.Group();
      pivot.add(spin);
      const tire = mesh(
        new T.CylinderGeometry(0.52, 0.52, 0.42, 32, 1),
        rubber,
        spin,
      );
      tire.rotation.z = Math.PI / 2;
      const wheel = mesh(
        new T.CylinderGeometry(0.33, 0.33, 0.44, 20),
        black,
        spin,
      );
      wheel.rotation.z = Math.PI / 2;
      const lip = mesh(
        new T.TorusGeometry(0.335, 0.023, 6, 32),
        metal,
        spin,
        side * 0.23,
        0,
        0,
      );
      lip.rotation.y = Math.PI / 2;
      const hub = mesh(new T.CylinderGeometry(0.1, 0.1, 0.47, 12), metal, spin);
      hub.rotation.z = Math.PI / 2;
      for (let j = 0; j < 8; j++) {
        const a = (j * Math.PI) / 4;
        const spoke = box(spin, metal, 0.04, 0.055, 0.51, side * 0.235, 0, 0);
        spoke.rotation.x = a;
      }
      const treadParts = [];
      for (let j = 0; j < 36; j++) {
        const a = (j * Math.PI) / 18,
          geo = new T.BoxGeometry(0.43, 0.013, 0.038);
        geo.rotateX(a);
        geo.translate(0, Math.cos(a) * 0.519, Math.sin(a) * 0.519);
        treadParts.push(geo);
      }
      const treadGeometry = mergeGeometries(treadParts);
      treadParts.forEach((g) => g.dispose());
      mesh(treadGeometry, black, spin);
      g.userData.wheels.push({ pivot, spin, front: z > 0, side });
    }
    const exhaust = mesh(
      new T.CylinderGeometry(0.11, 0.12, 0.48, 16),
      metal,
      g,
      side * 0.34,
      0.99,
      -1.57,
    );
    exhaust.rotation.x = Math.PI / 2;
    const hole = mesh(
      new T.CircleGeometry(0.085, 16),
      black,
      g,
      side * 0.34,
      0.99,
      -1.82,
    );
    hole.rotation.y = Math.PI;
  }
  tube(g, paint, [-0.45, 2.13, -0.88], [0.45, 2.13, -0.88], 0.065);
  tube(g, metal, [-1.06, 0.45, 1.77], [1.06, 0.45, 1.77], 0.065);
  const seat = box(g, black, 0.88, 1.1, 0.26, 0, 1.17, -0.58, 0.13);
  seat.rotation.x = -0.2;
  box(g, black, 0.89, 0.21, 0.8, 0, 0.71, -0.25, 0.12);
  for (let i = 0; i < 6; i++)
    box(g, carbon, 0.59, 0.035, 0.026, 0, 0.93 + i * 0.12, -0.38 - i * 0.024);
  const wing = box(g, paint, 2.03, 0.09, 0.49, 0, 1.6, -1.5, 0.025);
  wing.rotation.x = -0.13;
  for (const s of [-1, 1])
    box(g, carbon, 0.07, 0.32, 0.54, s * 1.03, 1.63, -1.5, 0.025);
  box(g, metal, 0.64, 0.37, 0.61, 0, 0.8, -1.11, 0.035);
  for (let i = 0; i < 7; i++)
    box(g, black, 0.68, 0.023, 0.5, 0, 0.68 + i * 0.05, -1.15);
  tube(g, metal, [0, 0.73, 0.25], [0, 1.25, 0.32], 0.035);
  const steering = mesh(
    new T.TorusGeometry(0.26, 0.033, 8, 24),
    black,
    g,
    0,
    1.23,
    0.32,
  );
  steering.rotation.x = -0.65;
  const decal = mesh(
    new T.PlaneGeometry(0.65, 0.16),
    new T.MeshBasicMaterial({ map: labelTexture("HAVOC"), transparent: true }),
    g,
    0,
    1.84,
    -0.795,
  );
  if (driver) {
    const suit = mat("#292f2d", 0.84),
      helmet = new T.MeshPhysicalMaterial({
        color,
        metalness: 0.3,
        roughness: 0.23,
        clearcoat: 1,
      });
    const torso = mesh(
      new T.CapsuleGeometry(0.29, 0.35, 6, 12),
      suit,
      g,
      0,
      1.18,
      -0.18,
    );
    torso.rotation.x = -0.17;
    mesh(new T.SphereGeometry(0.34, 24, 16), helmet, g, 0, 1.84, -0.25);
    const visor = mesh(
      new T.SphereGeometry(0.347, 24, 12, 0, Math.PI * 2, 0.95, 0.7),
      new T.MeshPhysicalMaterial({
        color: "#111e27",
        metalness: 1,
        roughness: 0.09,
      }),
      g,
      0,
      1.84,
      -0.25,
    );
    for (const s of [-1, 1]) {
      tube(g, suit, [s * 0.27, 1.4, -0.13], [s * 0.21, 1.21, 0.35], 0.09);
      tube(g, suit, [s * 0.2, 0.88, -0.12], [s * 0.22, 0.73, 0.87], 0.11);
    }
  }
  const batches = new Map();
  for (const o of [...g.children])
    if (o.isMesh) {
      o.updateMatrix();
      const geo = (
        o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()
      ).applyMatrix4(o.matrix);
      if (!batches.has(o.material)) batches.set(o.material, []);
      batches.get(o.material).push(geo);
      o.geometry.dispose();
      g.remove(o);
    }
  for (const [material, geometries] of batches) {
    mesh(mergeGeometries(geometries), material, g);
    geometries.forEach((geo) => geo.dispose());
  }
  const shield = mesh(
    new T.SphereGeometry(1, 24, 16),
    new T.MeshBasicMaterial({
      color: "#74d7ff",
      wireframe: true,
      transparent: true,
      opacity: 0.09,
      depthWrite: false,
    }),
    g,
    0,
    1,
    0,
  );
  shield.scale.set(1.65, 1.45, 2.15);
  shield.visible = false;
  shield.castShadow = false;
  g.userData.shield = shield;
  for (const side of [-1, 1]) {
    const flame = mesh(
      new T.ConeGeometry(0.16, 0.8, 8),
      new T.MeshBasicMaterial({
        color: "#7ccfff",
        transparent: true,
        opacity: 0.8,
      }),
      g,
      side * 0.34,
      0.99,
      -2.06,
    );
    flame.rotation.x = -Math.PI / 2;
    flame.visible = false;
    flame.castShadow = false;
    (g.userData.flames ||= []).push(flame);
  }
  return g;
}

export class ArenaScene {
  constructor(canvas) {
    this.renderer = new T.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.renderer.toneMapping = T.AgXToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.scene = new T.Scene();
    this.camera = new T.PerspectiveCamera(
      48,
      innerWidth / innerHeight,
      0.15,
      900,
    );
    this.camera.position.set(17, 4.5, 55);
    this.target = vec();
    this.worldGroup = new T.Group();
    this.scene.add(this.worldGroup);
    this.players = new Map();
    this.shots = new Map();
    this.particles = [];
    this.lobby = true;
    this.orbit = 0;
    this.quality = "high";
    const loader = new T.TextureLoader();
    const texture = (file, repeat) => {
      const t = loader.load("/assets/" + file);
      t.wrapS = t.wrapT = T.RepeatWrapping;
      t.repeat.set(repeat, repeat);
      t.anisotropy = 8;
      return t;
    };
    this.groundTex = texture("ground.jpg", 44);
    this.groundTex.colorSpace = T.SRGBColorSpace;
    this.groundNormal = texture("ground-normal.jpg", 44);
    this.rockTex = texture("rock.jpg", 2);
    this.rockTex.colorSpace = T.SRGBColorSpace;
    this.rockNormal = texture("rock-normal.jpg", 2);
    const sky = new Sky();
    sky.scale.setScalar(850);
    this.scene.add(sky);
    this.sky = sky;
    this.sun = new T.DirectionalLight(0xffe1a3, 3.5);
    this.sun.position.set(-65, 55, -95);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, {
      left: -48,
      right: 48,
      top: 48,
      bottom: -48,
      near: 1,
      far: 260,
    });
    this.sun.shadow.normalBias = 0.035;
    this.sun.shadow.bias = -0.0001;
    this.scene.add(this.sun, this.sun.target);
    this.ambient = new T.HemisphereLight(0xcfe0ed, 0x755a36, 2);
    this.scene.add(this.ambient);
    new RGBELoader().load(
      "/assets/sky.hdr",
      (t) => {
        t.mapping = T.EquirectangularReflectionMapping;
        this.scene.environment = t;
        this.scene.environmentIntensity = this.map === "harbor" ? 0.18 : 0.55;
      },
      undefined,
      () => {},
    );
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(
      new T.Vector2(innerWidth, innerHeight),
      0.14,
      0.4,
      1.4,
    );
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.hero = makeKart("#c4f564");
    this.hero.position.set(8, 0, 42);
    this.hero.rotation.y = 0.15;
    this.scene.add(this.hero);
    this.effects = new Effects(this.scene);
    this.cameraDistance = 1;
    this.shake = 0;
    this.screenShake = true;
    this.trails = [];
    this.effectTime = 0;
    this.setMap("canyon");
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }
  resize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
    this.composer.setSize(innerWidth, innerHeight);
  }
  setQuality(q) {
    this.quality = q;
    this.renderer.setPixelRatio(
      Math.min(devicePixelRatio, q === "low" ? 1 : 1.5),
    );
    this.renderer.shadowMap.enabled = q !== "low";
    this.composer.setPixelRatio(
      Math.min(devicePixelRatio, q === "low" ? 1 : 1.5),
    );
    this.resize();
  }
  setColor(color) {
    this.hero.userData.paint.color.set(color);
  }
  setMap(id) {
    if (this.map === id) return;
    this.map = id;
    // The real-time meshes are intentional: the kart and arena must support arbitrary camera angles and physical collisions.
    const textures = new Set([
      this.groundTex,
      this.groundNormal,
      this.rockTex,
      this.rockNormal,
    ]);
    this.worldGroup.traverse((o) => {
      o.geometry?.dispose();
      if (o.material)
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          if (m.map && !textures.has(m.map)) m.map.dispose();
          m.dispose();
        }
    });
    this.worldGroup.clear();
    this.effects?.clear();
    this.collisionMeshes = [];
    const g = this.worldGroup,
      canyon = id === "canyon",
      snow = id === "alpine",
      night = id === "harbor";
    const sky = this.sky.material.uniforms;
    sky.turbidity.value = canyon ? 7 : 3;
    sky.rayleigh.value = canyon ? 1.8 : 1;
    sky.mieCoefficient.value = 0.005;
    sky.mieDirectionalG.value = 0.8;
    sky.sunPosition.value.set(-0.5, night ? -0.12 : snow ? 0.36 : 0.13, -0.8);
    this.sky.visible = !night;
    this.scene.background = new T.Color(
      night ? "#060f20" : snow ? "#bacbd5" : "#d0b798",
    );
    this.scene.fog = new T.FogExp2(
      night ? "#0b1829" : snow ? "#b5c8d3" : "#c4ac91",
      night ? 0.005 : snow ? 0.0055 : 0.0028,
    );
    this.sun.color.set(canyon ? "#ffdaa0" : snow ? "#dbeeff" : "#8da4ff");
    this.sun.intensity = night ? 0.8 : snow ? 2.1 : 2.5;
    this.scene.environmentIntensity = night ? 0.18 : 0.55;
    this.ambient.color.set(night ? "#8195dc" : "#d8e4ef");
    this.ambient.groundColor.set(
      canyon ? "#78533a" : snow ? "#7c919d" : "#172442",
    );
    this.ambient.intensity = night ? 0.8 : 0.7;
    this.renderer.toneMappingExposure = night ? 1.35 : snow ? 1.1 : 1.05;
    const ground = new T.MeshStandardMaterial({
      color: canyon ? "#a38c6a" : snow ? "#eff7fb" : "#35454d",
      map: this.groundTex,
      normalMap: this.groundNormal,
      normalScale: new T.Vector2(0.75, 0.75),
      roughness: night ? 0.32 : 0.92,
      metalness: night ? 0.35 : 0,
    });
    const terrainGeo = new T.PlaneGeometry(700, 700, 160, 160),
      tp = terrainGeo.attributes.position;
    for (let i = 0; i < tp.count; i++) {
      const x = tp.getX(i),
        z = tp.getY(i),
        r = Math.hypot(x, z);
      if (r > 72)
        tp.setZ(
          i,
          Math.min(1, (r - 72) / 45) *
            (Math.sin(x * 0.045) * Math.cos(z * 0.06) * 5 +
              Math.sin(x * 0.11 + z * 0.04) * 2),
        );
    }
    terrainGeo.computeVertexNormals();
    const terrain = mesh(terrainGeo, ground, g, 0, -0.06, 0);
    terrain.rotation.x = -Math.PI / 2;
    const roadMat = new T.MeshStandardMaterial({
      color: night ? "#1e2a32" : snow ? "#8fa5ad" : "#44453f",
      map: this.groundTex,
      normalMap: this.groundNormal,
      normalScale: new T.Vector2(0.18, 0.18),
      roughness: night ? 0.23 : snow ? 0.5 : 0.84,
      metalness: night ? 0.65 : 0,
    });
    const roadGeo = new T.RingGeometry(20, 54, 120),
      roadUV = roadGeo.attributes.uv,
      roadPos = roadGeo.attributes.position;
    for (let i = 0; i < roadUV.count; i++)
      roadUV.setXY(i, roadPos.getX(i) / 180, roadPos.getY(i) / 180);
    const road = mesh(roadGeo, roadMat, g, 0, 0.015, 0);
    road.rotation.x = -Math.PI / 2;
    for (const r of [20.5, 53.3]) {
      const line = mesh(
        new T.RingGeometry(r, r + 0.17, 100),
        mat(snow ? "#e6ecee" : "#c7b899"),
        g,
        0,
        0.025,
        0,
      );
      line.rotation.x = -Math.PI / 2;
    }
    const steel = mat("#343f3e", 0.55, 0.7),
      barrier = mat(snow ? "#becad0" : "#ccc1a7", 0.85),
      accent = mat(night ? "#33d6eb" : "#c4f564", 0.6, 0.2);
    const emissive = new T.MeshStandardMaterial({
      color: night ? "#31d5ff" : "#e7ead7",
      emissive: night ? "#14bde8" : "#f1e3a4",
      emissiveIntensity: night ? 3 : 1,
    });
    for (let i = 0; i < 86; i++) {
      const a = (i * Math.PI * 2) / 86,
        x = Math.sin(a) * 68,
        z = Math.cos(a) * 68;
      const b = box(
        g,
        i % 4 === 0 ? accent : barrier,
        4.6,
        1.15,
        0.8,
        x,
        0.58,
        z,
        0.06,
      );
      b.rotation.y = a;
    }
    for (let i = 0; i < 28; i++) {
      const a = (i * Math.PI * 2) / 28;
      const line = box(
        g,
        barrier,
        0.25,
        0.016,
        1.6,
        Math.sin(a) * 36,
        0.038,
        Math.cos(a) * 36,
      );
      line.rotation.y = a;
    }
    let seed = 184;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const rockMat = new T.MeshStandardMaterial({
      color: canyon ? "#a57e59" : snow ? "#a9b7bd" : "#445868",
      map: this.rockTex,
      normalMap: this.rockNormal,
      normalScale: new T.Vector2(1, 1),
      roughness: 1,
    });
    const rock = (x, z, w, h, d) => {
      const geo = new T.CylinderGeometry(w * 0.5, w, h, 24, 28);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const angle = Math.atan2(pos.getZ(i), pos.getX(i));
        const scale =
          1 +
          Math.sin(y * 1.7) * 0.025 +
          Math.sin(y * 0.73) * 0.04 +
          Math.sin(angle * 3 + y * 0.07) * 0.16 +
          Math.cos(angle * 7 + y * 0.09) * 0.065;
        pos.setXYZ(
          i,
          pos.getX(i) * scale + Math.sin(y * 0.4) * w * 0.09,
          y,
          (pos.getZ(i) * scale * d) / w,
        );
      }
      geo.computeVertexNormals();
      const o = mesh(geo, rockMat, g, x, h / 2 - 0.4, z);
      o.rotation.y = random() * 6.28;
      return o;
    };
    if (!night)
      for (let i = 0; i < 46; i++) {
        const a = (i * 6.28) / 46,
          r = 145 + random() * 100,
          w = 18 + random() * 22,
          h = (snow ? 55 : 28) + random() * (snow ? 75 : 45);
        rock(
          Math.sin(a) * r,
          Math.cos(a) * r,
          w,
          h,
          w * (0.6 + random() * 0.5),
        );
        if (snow) {
          const cap = mesh(
            new T.ConeGeometry(w * 0.77, h * 0.6, 8),
            mat("#e7f1f3"),
            g,
            Math.sin(a) * r,
            h * 0.93,
            Math.cos(a) * r,
          );
          cap.rotation.y = random() * 3;
        }
      }
    for (const [x, z, w, d] of MAPS[id].obstacles) {
      if (canyon) {
        const obstacle = box(g, rockMat, w, 5, d, x, 2.5, z, 0.7);
        this.collisionMeshes.push(obstacle);
        for (let j = 0; j < 3; j++) {
          const ledge = box(
            g,
            rockMat,
            w + 0.08,
            0.18,
            d + 0.08,
            x,
            0.9 + j * 1.3,
            z,
            0.12,
          );
          ledge.castShadow = false;
        }
      } else if (snow) {
        this.collisionMeshes.push(box(g, rockMat, w, 4.7, d, x, 2.35, z, 0.5));
        box(g, mat("#f2f8fa"), w, 0.3, d, x, 4.85, z, 0.15);
      } else {
        const container = mat(
          ["#244d64", "#96394f", "#b37236"][Math.floor(random() * 3)],
          0.58,
          0.5,
        );
        this.collisionMeshes.push(box(g, container, w, 5, d, x, 2.5, z));
        for (let j = -w / 2 + 0.4; j < w / 2; j += 0.7)
          box(g, steel, 0.07, 4.8, d + 0.06, x + j, 2.5, z);
        box(g, emissive, w, 0.06, 0.08, x, 5.02, z + d / 2);
      }
    }
    for (const [x, z, w, d] of MAPS[id].ramps) {
      const geo = new T.BufferGeometry();
      geo.setAttribute(
        "position",
        new T.Float32BufferAttribute(
          [
            -w / 2,
            0,
            -d / 2,
            w / 2,
            0,
            -d / 2,
            w / 2,
            3.5,
            d / 2,
            -w / 2,
            0,
            -d / 2,
            w / 2,
            3.5,
            d / 2,
            -w / 2,
            3.5,
            d / 2,
          ],
          3,
        ),
      );
      geo.computeVertexNormals();
      const o = mesh(
        geo,
        new T.MeshStandardMaterial({
          color: "#444c48",
          metalness: 0.5,
          roughness: 0.8,
          side: T.DoubleSide,
        }),
        g,
        x,
        0.03,
        z,
      );
      this.collisionMeshes.push(o);
      box(g, steel, w, 3.45, 0.18, x, 1.7, z + d / 2);
      for (const side of [-1, 1])
        for (let j = 0; j < 5; j++) {
          const rz = z - d / 2 + ((j + 0.5) * d) / 5,
            h = ((j + 0.5) / 5) * 3.5;
          box(g, steel, 0.12, h, 0.12, x + side * (w / 2 - 0.2), h / 2, rz);
        }
      for (const side of [-1, 1])
        tube(
          g,
          accent,
          [x + (side * w) / 2, 0.1, z - d / 2],
          [x + (side * w) / 2, 3.6, z + d / 2],
          0.09,
        );
    }
    for (let i = 0; i < 12; i++) {
      const a = (i * 6.28) / 12,
        x = Math.sin(a) * 74,
        z = Math.cos(a) * 74;
      box(g, steel, 0.18, 12, 0.18, x, 6, z);
      const lamp = box(g, emissive, 3, 0.17, 0.6, x, 12, z);
      lamp.rotation.y = a;
      if (night) {
        const light = new T.PointLight(i % 2 ? 0x31daff : 0xee42bd, 65, 30, 2);
        light.position.set(x, 9, z);
        g.add(light);
      }
    }
    for (let i = 0; i < 7; i++) {
      const a = (i * 6.28) / 7,
        x = Math.sin(a) * 74,
        z = Math.cos(a) * 74;
      const board = mesh(
        new T.PlaneGeometry(9, 2.3),
        new T.MeshStandardMaterial({
          map: labelTexture(i % 2 ? "ALL GAS." : "HAVOC"),
          side: T.DoubleSide,
          roughness: 0.8,
        }),
        g,
        x,
        3.7,
        z,
      );
      board.rotation.y = a + Math.PI;
      for (const s of [-1, 1])
        box(
          g,
          steel,
          0.16,
          3,
          0.16,
          x + Math.cos(a) * s * 3,
          1.5,
          z - Math.sin(a) * s * 3,
        );
    }
    if (snow)
      for (let i = 0; i < 85; i++) {
        const a = random() * 6.28,
          r = 77 + random() * 38,
          x = Math.sin(a) * r,
          z = Math.cos(a) * r,
          h = 5 + random() * 7;
        box(g, mat("#615e54"), 0.3, h * 0.6, 0.3, x, h * 0.25, z);
        for (let j = 0; j < 3; j++) {
          mesh(
            new T.ConeGeometry(h * 0.28 * (1 - j * 0.17), h * 0.55, 7),
            mat(j % 2 ? "#cadada" : "#3d625c"),
            g,
            x,
            h * 0.5 + j * h * 0.17,
            z,
          );
        }
      }
    if (night) {
      const building = mat("#1c2b3b", 0.8, 0.4);
      for (let i = 0; i < 32; i++) {
        const a = (i * 6.28) / 32,
          r = 110 + random() * 55,
          h = 15 + random() * 40,
          x = Math.sin(a) * r,
          z = Math.cos(a) * r;
        box(g, building, 12, h, 14, x, h / 2, z);
        for (let k = 3; k < h; k += 5)
          box(g, emissive, 10, 0.16, 0.1, x, k, z + 7.1);
      }
      for (const x of [-85, 85])
        for (const z of [-60, 40]) {
          for (const dx of [-9, 9]) {
            box(g, steel, 0.7, 37, 0.7, x + dx, 18, z);
            tube(g, steel, [x + dx, 36, z], [x, 43, z], 0.28);
          }
          box(g, steel, 50, 0.8, 1, x, 37, z);
          tube(g, steel, [x, 43, z], [x + 24, 37, z], 0.15);
          tube(g, steel, [x + 20, 37, z], [x + 20, 14, z], 0.07);
        }
    }
    this.pickupMeshes = [];
    const pickupMat = new T.MeshStandardMaterial({
      color: "#d5ff78",
      emissive: "#91b93f",
      emissiveIntensity: 0.18,
      metalness: 0.1,
      roughness: 0.4,
    });
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6,
        r = i % 2 ? 47 : 26;
      const p = new T.Group();
      p.position.set(Math.sin(a) * r, 1.4, Math.cos(a) * r);
      g.add(p);
      box(p, pickupMat, 1.45, 1.45, 1.45, 0, 0, 0, 0.12);
      const q = labelTexture("?", "#151b12", "#d5ff78");
      for (let j = 0; j < 4; j++) {
        const face = mesh(
          new T.PlaneGeometry(0.85, 0.85),
          new T.MeshBasicMaterial({ map: q }),
          p,
          Math.sin((j * Math.PI) / 2) * 0.733,
          0,
          Math.cos((j * Math.PI) / 2) * 0.733,
        );
        face.rotation.y = (j * Math.PI) / 2;
      }
      const ring = mesh(
        new T.TorusGeometry(1.1, 0.03, 5, 24),
        emissive,
        p,
        0,
        -0.9,
        0,
      );
      ring.rotation.x = Math.PI / 2;
      this.pickupMeshes.push(p);
    }
    this.barrelMeshes = BARREL_POSITIONS.map(([x, z]) => {
      const barrel = new T.Group();
      barrel.position.set(x, 0, z);
      g.add(barrel);
      const shell = mat("#a84220", 0.65, 0.45);
      mesh(
        new T.CylinderGeometry(0.62, 0.62, 1.5, 18),
        shell,
        barrel,
        0,
        0.75,
        0,
      );
      for (const y of [0.15, 0.45, 1.05, 1.35])
        mesh(
          new T.TorusGeometry(0.63, 0.032, 5, 18).rotateX(Math.PI / 2),
          steel,
          barrel,
          0,
          y,
          0,
        );
      box(barrel, mat("#f0c859"), 1.27, 0.3, 0.1, 0, 0.8, 0.58);
      return barrel;
    });
    this.repairMeshes = REPAIR_POSITIONS.map(([x, z]) => {
      const q = new T.Group();
      q.position.set(x, 1, z);
      g.add(q);
      const material = new T.MeshStandardMaterial({
        color: "#d4efe0",
        roughness: 0.5,
        metalness: 0.15,
      });
      box(q, material, 1.1, 0.8, 0.85, 0, 0, 0, 0.1);
      const green = new T.MeshBasicMaterial({ color: "#59ed94" });
      for (const side of [-1, 1]) {
        box(q, green, 0.17, 0.5, 0.025, 0, 0, side * 0.44);
        box(q, green, 0.5, 0.17, 0.025, 0, 0, side * 0.44);
      }
      return q;
    });
    for (const [x, z, angle] of BOOST_PADS) {
      const pad = new T.Group();
      pad.position.set(x, 0.045, z);
      pad.rotation.y = angle;
      g.add(pad);
      box(pad, steel, 4, 0.06, 5, 0, 0, 0, 0.05);
      const light = new T.MeshStandardMaterial({
        color: "#63cced",
        emissive: "#24a4ee",
        emissiveIntensity: 1.4,
      });
      for (let j = 0; j < 3; j++)
        for (const side of [-1, 1]) {
          const chevron = box(
            pad,
            light,
            1.5,
            0.06,
            0.15,
            side * 0.53,
            0.06,
            -1.5 + j * 1.2,
          );
          chevron.rotation.y = side * 0.45;
        }
    }
    const stoneGeo = new T.IcosahedronGeometry(1, 1),
      stoneMat = mat(snow ? "#d6e1e4" : night ? "#51616b" : "#82715a", 0.95),
      stones = new T.InstancedMesh(stoneGeo, stoneMat, 180),
      dummy = new T.Object3D();
    for (let i = 0; i < 180; i++) {
      const a = random() * 6.28,
        r = 70 + random() * 47;
      dummy.position.set(Math.sin(a) * r, 0.15, Math.cos(a) * r);
      dummy.rotation.set(random(), random() * 6, random());
      dummy.scale.set(
        0.15 + random() * 1.2,
        0.1 + random() * 0.5,
        0.2 + random(),
      );
      dummy.updateMatrix();
      stones.setMatrixAt(i, dummy.matrix);
    }
    stones.receiveShadow = true;
    g.add(stones);
    const tyreGeo = new T.TorusGeometry(0.53, 0.19, 7, 16).rotateX(Math.PI / 2),
      tyres = new T.InstancedMesh(tyreGeo, mat("#1a201e", 0.95), 144);
    for (let i = 0; i < 144; i++) {
      const stack = Math.floor(i / 3),
        a = (stack * 6.28) / 48;
      dummy.position.set(
        Math.sin(a) * 69.5,
        0.19 + (i % 3) * 0.35,
        Math.cos(a) * 69.5,
      );
      dummy.rotation.set(0, a, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      tyres.setMatrixAt(i, dummy.matrix);
    }
    tyres.receiveShadow = tyres.castShadow = true;
    g.add(tyres);
    const count = night ? 850 : snow ? 650 : 130,
      positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (random() - 0.5) * 180;
      positions[i * 3 + 1] = random() * 50;
      positions[i * 3 + 2] = (random() - 0.5) * 180;
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.BufferAttribute(positions, 3));
    this.weather = new T.Points(
      geo,
      new T.PointsMaterial({
        color: snow ? "#ffffff" : night ? "#9eb2dd" : "#e6cda1",
        size: snow ? 0.16 : night ? 0.09 : 0.06,
        transparent: true,
        opacity: snow ? 0.8 : 0.4,
        depthWrite: false,
      }),
    );
    g.add(this.weather);
  }
  explosion(x, y, z, size = 2, weapon = "rocket") {
    if (size < 0.5) {
      this.effects.emit(x, y, z, 7, "spark", 0.35);
      return;
    }
    const emp = weapon === "emp";
    this.effects.emit(
      x,
      y,
      z,
      emp ? 35 : 55,
      emp ? "purple" : "flame",
      size * 0.7,
    );
    this.effects.emit(
      x,
      y,
      z,
      emp ? 12 : 30,
      emp ? "boost" : "smoke",
      size * 0.65,
    );
    this.effects.emit(x, y, z, 20, "spark", size * 0.6);
    const ring = mesh(
      new T.TorusGeometry(1, 0.06, 5, 48),
      new T.MeshBasicMaterial({
        color: emp ? "#b397ff" : "#ffc070",
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      }),
      this.scene,
      x,
      y,
      z,
    );
    ring.rotation.x = -Math.PI / 2;
    ring.castShadow = false;
    this.trails.push({ obj: ring, life: 0.45, max: 0.45, ring: true, size });
    const dist = this.camera.position.distanceTo(vec(x, y, z));
    this.shake = Math.max(this.shake, Math.max(0, 1 - dist / 28) * size * 0.12);
  }
  tracer(from, to) {
    const line = tube(
      this.scene,
      new T.MeshBasicMaterial({
        color: "#91eeff",
        transparent: true,
        opacity: 1,
        depthWrite: false,
      }),
      [from.x, from.y, from.z],
      [to.x, to.y, to.z],
      0.065,
    );
    line.castShadow = false;
    this.trails.push({ obj: line, life: 0.18, max: 0.18 });
  }
  clearPlayers() {
    for (const obj of this.players.values()) this.disposeObject(obj);
    this.players.clear();
    for (const obj of this.shots.values()) this.disposeObject(obj);
    this.shots.clear();
    this.effects?.clear();
    for (const t of this.trails) this.disposeObject(t.obj);
    this.trails = [];
  }
  disposeObject(obj) {
    obj.traverse((o) => {
      o.geometry?.dispose();
      if (o.material)
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          m.map?.dispose();
          m.dispose();
        }
    });
    obj.removeFromParent();
  }
  update(dt, time, state, localId, predicted) {
    this.hero.visible = this.lobby;
    this.effectTime += dt;
    const emitTrail = this.effectTime > 0.04;
    if (emitTrail) this.effectTime = 0;
    this.barrelMeshes.forEach(
      (b, i) => (b.visible = this.lobby || !state?.barrels?.[i]?.cooldown),
    );
    this.repairMeshes.forEach((q, i) => {
      q.visible = this.lobby || !state?.repairs?.[i]?.cooldown;
      q.rotation.y = time * 0.7;
      q.position.y = 1.15 + Math.sin(time * 2 + i) * 0.15;
    });
    this.pickupMeshes.forEach((p, i) => {
      p.rotation.y = time * 0.65;
      p.position.y = 1.6 + Math.sin(time * 2 + i) * 0.22;
      p.visible = this.lobby || !state?.pickups[i]?.cooldown;
    });
    const pos = this.weather.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y =
        pos.getY(i) -
        dt * (this.map === "harbor" ? 19 : this.map === "alpine" ? 2.6 : 0.16);
      if (y < 0) y = 50;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    if (this.lobby) {
      const a = this.orbit + Math.sin(time * 0.12) * 0.07;
      const target = innerWidth < 700 ? vec(8, 1.1, 42) : vec(5.9, 1.05, 43.6);
      const offset = vec(
        Math.sin(0.65 + a) * 8.3,
        3.05,
        Math.cos(0.65 + a) * 8.3,
      );
      const cameraPos = this.hero.position.clone().add(offset);
      this.camera.position.lerp(cameraPos, Math.min(1, dt * 4));
      this.target.lerp(target, Math.min(1, dt * 4));
      this.camera.fov = innerWidth < 700 ? 60 : 48;
    } else if (state) {
      const ids = new Set();
      for (const p of state.players) {
        ids.add(p.id);
        let obj = this.players.get(p.id);
        if (!obj) {
          obj = makeKart(p.color, true);
          this.scene.add(obj);
          this.players.set(p.id, obj);
          obj.position.set(p.x, p.y, p.z);
          obj.rotation.y = p.angle;
        }
        const q = p.id === localId && predicted ? predicted : p;
        obj.visible = p.dead <= 0;
        obj.position.lerp(
          vec(q.x, q.y, q.z),
          Math.min(1, dt * (p.id === localId ? 24 : 13)),
        );
        obj.rotation.y +=
          angleDiff(q.angle, obj.rotation.y) * Math.min(1, dt * 16);
        obj.rotation.z = T.MathUtils.lerp(
          obj.rotation.z,
          q.roll || 0,
          1 - Math.exp(-dt * 10),
        );
        obj.rotation.x = T.MathUtils.lerp(
          obj.rotation.x,
          q.pitch || 0,
          1 - Math.exp(-dt * 9),
        );
        obj.position.y -= Math.sin((q.landing || 0) * Math.PI) * 0.09;
        for (const w of obj.userData.wheels) {
          w.spin.rotation.x += ((q.forwardSpeed || q.speed) * dt) / 0.52;
          w.pivot.rotation.y = w.front ? q.steerAngle || 0 : 0;
          w.pivot.position.y =
            0.52 +
            Math.sin(time * 35 + w.side) * Math.min(q.speed * 0.0007, 0.025);
        }
        obj.userData.shield.visible = q.shield > 0;
        obj.userData.shield.material.opacity =
          0.07 + Math.sin(time * 5) * 0.025;
        obj.userData.flames.forEach((f) => {
          f.visible = !!q.boosting;
          f.scale.y = 0.8 + Math.random() * 0.7;
        });
        if (emitTrail && q.dead <= 0) {
          for (const side of [-1, 1]) {
            const x = q.x + Math.cos(q.angle) * side * 1.05 - Math.sin(q.angle),
              z = q.z - Math.sin(q.angle) * side * 1.05 - Math.cos(q.angle);
            if (q.grounded && q.speed > 7) {
              this.effects.emit(
                x,
                q.y + 0.2,
                z,
                q.drifting ? 3 : 1,
                this.map === "alpine" ? "snow" : "dust",
                0.3,
              );
              if (q.slip > 2.5) this.effects.skid(x, q.y, z, q.angle);
            }
            if (q.drifting && q.driftCharge > 0.65)
              this.effects.emit(
                x,
                q.y + 0.2,
                z,
                2,
                q.driftCharge > 1.7 ? "flame" : "boost",
                0.2,
              );
            if (q.boosting) this.effects.emit(x, q.y + 0.6, z, 2, "boost", 0.2);
          }
          if (q.hp < 35) this.effects.emit(q.x, q.y + 1, q.z, 2, "smoke", 0.5);
        }
      }
      for (const [id, obj] of this.players)
        if (!ids.has(id)) {
          this.disposeObject(obj);
          this.players.delete(id);
        }
      const shotIds = new Set();
      for (const s of state.projectiles) {
        shotIds.add(s.id);
        let obj = this.shots.get(s.id);
        if (!obj) {
          obj = new T.Group();
          const color = WEAPONS[s.type]?.color || "#ffda88";
          const metal = new T.MeshStandardMaterial({
            color: "#3c454a",
            roughness: 0.35,
            metalness: 0.7,
          });
          const glow = new T.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 1.8,
          });
          if (s.type === "mine") {
            mesh(new T.CylinderGeometry(0.58, 0.62, 0.18, 16), metal, obj);
            mesh(new T.SphereGeometry(0.14, 8, 6), glow, obj, 0, 0.17, 0);
          } else if (s.type === "grenade") {
            mesh(new T.SphereGeometry(0.32, 12, 8), metal, obj);
            mesh(new T.TorusGeometry(0.32, 0.04, 5, 12), glow, obj);
          } else {
            const body = mesh(
              new T.CapsuleGeometry(
                s.type === "blaster" || s.type === "shotgun" ? 0.045 : 0.14,
                0.6,
                3,
                8,
              ),
              s.type === "blaster" || s.type === "shotgun" ? glow : metal,
              obj,
            );
            body.rotation.x = Math.PI / 2;
            mesh(new T.SphereGeometry(0.1, 6, 4), glow, obj, 0, 0, -0.4);
          }
          this.scene.add(obj);
          this.shots.set(s.id, obj);
        }
        obj.position.set(s.x, s.y, s.z);
        if (s.type !== "mine") obj.rotation.y = Math.atan2(s.vx, s.vz);
        if (emitTrail && (s.type === "rocket" || s.type === "homing"))
          this.effects.emit(
            s.x,
            s.y,
            s.z,
            2,
            s.type === "homing" ? "purple" : "smoke",
            0.15,
          );
      }
      for (const [id, obj] of this.shots)
        if (!shotIds.has(id)) {
          this.disposeObject(obj);
          this.shots.delete(id);
        }
      const p = predicted || state.players.find((p) => p.id === localId);
      if (p) {
        const behind = vec(
          -Math.sin(p.angle) * 8.8 * this.cameraDistance,
          4.5 * this.cameraDistance,
          -Math.cos(p.angle) * 8.8 * this.cameraDistance,
        );
        const desired = vec(p.x, p.y, p.z).add(behind);
        // Pull the chase camera in when a wall is between it and the kart.
        const focus = vec(p.x, p.y + 1.4, p.z),
          direction = desired.clone().sub(focus),
          length = direction.length();
        const ray = new T.Raycaster(focus, direction.normalize(), 0, length),
          hit = ray.intersectObjects(this.collisionMeshes, false)[0];
        if (hit)
          desired
            .copy(focus)
            .addScaledVector(direction, Math.max(1.5, hit.distance - 0.45));
        this.camera.position.lerp(desired, 1 - Math.exp(-7 * dt));
        this.target.lerp(
          vec(
            p.x + Math.sin(p.angle) * 4,
            p.y + 1,
            p.z + Math.cos(p.angle) * 4,
          ),
          1 - Math.exp(-9 * dt),
        );
        this.camera.fov = T.MathUtils.lerp(
          this.camera.fov,
          57 + Math.min(p.speed, 44) * 0.2 + (p.boosting ? 5 : 0),
          dt * 3,
        );
      }
    }
    this.effects.update(dt);
    for (let i = this.trails.length - 1; i >= 0; i--) {
      const t = this.trails[i];
      t.life -= dt;
      t.obj.material.opacity = Math.max(0, t.life / t.max);
      if (t.ring) t.obj.scale.setScalar(1 + (1 - t.life / t.max) * t.size * 2);
      if (t.life <= 0) {
        this.disposeObject(t.obj);
        this.trails.splice(i, 1);
      }
    }
    this.sun.target.position.copy(
      this.lobby
        ? this.hero.position
        : vec(predicted?.x || 0, 0, predicted?.z || 0),
    );
    this.sun.position.copy(this.sun.target.position).add(vec(-65, 70, -95));
    this.shake = Math.max(0, this.shake - dt * 2);
    if (this.screenShake && this.shake) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake;
      this.camera.position.y += (Math.random() - 0.5) * this.shake;
    }
    this.camera.lookAt(this.target);
    this.camera.updateProjectionMatrix();
    if (this.quality === "high") this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }
  screenPosition(x, y, z) {
    const p = vec(x, y, z).project(this.camera);
    return {
      x: (p.x * 0.5 + 0.5) * innerWidth,
      y: (-p.y * 0.5 + 0.5) * innerHeight,
      visible: p.z > -1 && p.z < 1 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1,
    };
  }
}
