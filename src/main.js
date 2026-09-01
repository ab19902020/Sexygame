import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import BED_DATA from "./bed-data.js";
import CHARACTER_DATA from "./character-data.js";


const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8b8790);
scene.fog = new THREE.Fog(0x8b8790, 15, 26);
const camera = new THREE.PerspectiveCamera(
  39,
  innerWidth / innerHeight,
  0.05,
  60,
);
camera.position.set(6.8, 3.3, 7.8);
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.prepend(renderer.domElement);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(
  new RoomEnvironment(),
  0.04,
).texture;
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.35, 0);
controls.enableDamping = true;
controls.minDistance = 3;
controls.maxDistance = 13;
controls.maxPolarAngle = Math.PI * 0.49;
controls.enabled = false;
const loader = new GLTFLoader();

const mat = (color, rough = 0.72, metal = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
const box = (name, size, pos, color, rough = 0.72, metal = 0) => {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    mat(color, rough, metal),
  );
  m.name = name;
  m.position.set(...pos);
  m.castShadow = m.receiveShadow = true;
  scene.add(m);
  return m;
};
// Architectural shell
box("floor", [12, 0.18, 10], [0, -0.09, 0], 0x65564f, 0.85);
box("back wall", [12, 5, 0.18], [0, 2.5, -5], 0xd7d0c7, 0.95);
box("side wall", [0.18, 5, 10], [-6, 2.5, 0], 0xc8c0b8, 0.95);
// inset rug beneath the correctly scaled bed
box("rug", [4.25, 0.035, 3.8], [-1.1, 0.025, -1.25], 0x8b817c, 1);
// furniture
box("nightstand", [0.82, 0.72, 0.78], [-2.72, 0.38, -2.1], 0x4b3c36, 0.6);
box("nightstand", [0.82, 0.72, 0.78], [0.52, 0.38, -2.1], 0x4b3c36, 0.6);
box("dresser", [2.8, 1.45, 1.0], [3.9, 0.78, -4.32], 0x493d38, 0.65);
box("bench", [1.9, 0.42, 0.7], [-1.1, 0.45, 0.72], 0x6b5550, 0.7);
for (let i = 0; i < 3; i++)
  box(
    "drawer",
    [2.52, 0.025, 0.72],
    [3.9, 0.38 + i * 0.42, -3.805],
    0x75645b,
    0.65,
  );
// window, curtains and skyline
box("window", [4.25, 2.65, 0.08], [1.35, 3.15, -4.89], 0x303947, 0.35, 0.08);
box("curtain", [0.75, 3.35, 0.18], [-1.08, 2.8, -4.7], 0x87766e, 0.95);
box("curtain", [0.75, 3.35, 0.18], [3.78, 2.8, -4.7], 0x87766e, 0.95);
for (let i = 0; i < 8; i++)
  box(
    "skyline",
    [0.3, 0.25 + Math.random() * 0.8, 0.08],
    [-0.45 + i * 0.48, 2.1, -4.82],
    0x1c2430,
    0.85,
  );
// lamps
for (const x of [-2.72, 0.52]) {
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.05, 0.72, 14),
    mat(0xb79a74, 0.25, 0.5),
  );
  stem.position.set(x, 1.02, -2.1);
  stem.castShadow = true;
  scene.add(stem);
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.42, 0.52, 24, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xdbc5ac,
      roughness: 0.85,
      side: THREE.DoubleSide,
    }),
  );
  shade.position.set(x, 1.41, -2.1);
  scene.add(shade);
  const l = new THREE.PointLight(0xffd7a8, 15, 5, 2);
  l.position.set(x, 1.38, -2.06);
  l.castShadow = true;
  scene.add(l);
}
const ceiling = new THREE.RectAreaLight(0xffead2, 4.5, 5, 3);
ceiling.position.set(0, 4.65, 0);
ceiling.lookAt(0, 0, 0);
scene.add(ceiling);
const fill = new THREE.DirectionalLight(0xbdd5ff, 2.4);
fill.position.set(4, 7, 3);
fill.castShadow = true;
fill.shadow.mapSize.set(1024, 1024);
scene.add(fill);

const BED_CENTER = new THREE.Vector3(-1.1, 0.55, -1.3);
const BED_SIZE = new THREE.Vector3(2.1, 1.1, 2.35);
const MODEL_FORWARD_OFFSET = Math.PI;
let character,
  characterVisual,
  bed,
  mixer,
  sampleAction,
  baseY = 0,
  mode = "sequence",
  modeStarted = 0,
  introPlaying = true;
const bones = {},
  rest = {},
  clock = new THREE.Clock();
const motionNames = {
  sequence: "Bedroom Scene",
  idle: "Idle",
  walk: "Walk Around",
  sway: "Hip Sway",
  pose: "Pose",
  sit: "Sit on Bed",
  camera: "Camera Tease",
  wave: "Playful Wave",
  afraid: "Original Clip",
};
const panel = document.querySelector("#motions");
for (const [id, label] of Object.entries(motionNames)) {
  const b = document.createElement("button");
  b.textContent = label;
  b.dataset.mode = id;
  b.onclick = () => {
    mode = id;
    document
      .querySelectorAll("button")
      .forEach((x) => x.classList.toggle("active", x === b));
  };
  panel.appendChild(b);
}
panel.firstChild.classList.add("active");
panel.style.opacity = "0";
panel.style.transform = "translateY(24px)";
panel.style.transition = "opacity .7s, transform .7s";
panel.style.pointerEvents = "none";
function selectMode(next) {
  mode = next;
  modeStarted = clock.elapsedTime;
  if (sampleAction) {
    sampleAction.stop();
    if (next === "afraid") sampleAction.reset().fadeIn(0.2).play();
  }
  document
    .querySelectorAll("button")
    .forEach((x) => x.classList.toggle("active", x.dataset.mode === next));
}
panel
  .querySelectorAll("button")
  .forEach((b) => (b.onclick = () => selectMode(b.dataset.mode)));
function beginExperience() {
  if (!character || !bed || !introPlaying) return;
  selectMode("sequence");
  modeStarted = clock.elapsedTime;
  document.querySelector("#loading").style.opacity = 0;
  setTimeout(() => document.querySelector("#loading")?.remove(), 500);
  setTimeout(() => {
    introPlaying = false;
    controls.enabled = true;
    selectMode("idle");
    panel.style.opacity = "1";
    panel.style.transform = "translateY(0)";
    panel.style.pointerEvents = "auto";
    document.querySelector("#hint").textContent =
      "Scene complete · Choose a pose or drag to look";
  }, 28000);
}
loader.load(BED_DATA, (g) => {
  const model = g.scene;
  model.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = o.receiveShadow = true;
      o.material.envMapIntensity = 0.7;
    }
  });
  const b = new THREE.Box3().setFromObject(model),
    s = b.getSize(new THREE.Vector3()),
    c = b.getCenter(new THREE.Vector3());
  model.position.set(-c.x, -c.y, -c.z);
  bed = new THREE.Group();
  bed.add(model);
  bed.scale.set(BED_SIZE.x / s.x, BED_SIZE.y / s.y, BED_SIZE.z / s.z);
  bed.position.copy(BED_CENTER);
  scene.add(bed);
  beginExperience();
});
loader.load(
  CHARACTER_DATA,
  (g) => {
    characterVisual = g.scene;
    characterVisual.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = o.receiveShadow = true;
        o.material.envMapIntensity = 0.65;
      }
      if (o.isBone) {
        bones[o.name] = o;
        rest[o.name] = { q: o.quaternion.clone(), p: o.position.clone() };
      }
    });
    const b = new THREE.Box3().setFromObject(characterVisual),
      s = b.getSize(new THREE.Vector3()),
      c = b.getCenter(new THREE.Vector3());
    characterVisual.position.set(-c.x, -b.min.y, -c.z);
    character = new THREE.Group();
    character.add(characterVisual);
    character.scale.setScalar(1.72 / s.y);
    character.position.set(1.0, 0, 0.65);
    baseY = 0;
    scene.add(character);
    mixer = new THREE.AnimationMixer(characterVisual);
    if (g.animations[0]) sampleAction = mixer.clipAction(g.animations[0]);
    beginExperience();
  },
  (xhr) => {
    if (xhr.total) {
      const p = Math.round((xhr.loaded / xhr.total) * 100);
      document.querySelector("#bar").style.width = p + "%";
      document.querySelector("#status").textContent =
        "Loading rigged character… " + p + "%";
    }
  },
  (e) => {
    document.querySelector("#status").textContent =
      "Rigged character could not be loaded";
    console.error(e);
  },
);

const apply = (name, x = 0, y = 0, z = 0) => {
  const b = bones[name],
    r = rest[name];
  if (!b || !r) return;
  b.quaternion
    .copy(r.q)
    .multiply(
      new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, "XYZ")),
    );
};
function resetRig() {
  for (const [name, b] of Object.entries(bones)) {
    b.quaternion.copy(rest[name].q);
    b.position.copy(rest[name].p);
  }
}
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (v) => {
  v = clamp01(v);
  return v * v * (3 - 2 * v);
};
function walk(t, weight = 1) {
  const phase = t * 5.25;
  const left = Math.sin(phase);
  const right = -left;
  const leftLift = Math.max(0, -left);
  const rightLift = Math.max(0, -right);
  apply("L_Thigh", left * 0.36 * weight, 0, -0.015 * weight);
  apply("R_Thigh", right * 0.36 * weight, 0, 0.015 * weight);
  apply("L_Calf", leftLift * 0.58 * weight, 0, 0);
  apply("R_Calf", rightLift * 0.58 * weight, 0, 0);
  apply("L_Foot", -left * 0.14 * weight, 0, 0);
  apply("R_Foot", -right * 0.14 * weight, 0, 0);
  apply("L_Upperarm", right * 0.24 * weight, 0, -0.08 * weight);
  apply("R_Upperarm", left * 0.24 * weight, 0, 0.08 * weight);
  apply("L_Forearm", -0.12 * weight, 0, -0.03 * weight);
  apply("R_Forearm", -0.12 * weight, 0, 0.03 * weight);
  apply("Pelvis", 0, Math.sin(phase) * 0.035 * weight, Math.sin(phase * 2) * 0.025 * weight);
  apply("Waist", 0, -Math.sin(phase) * 0.045 * weight, 0);
  apply("Spine02", 0, -Math.sin(phase) * 0.035 * weight, 0);
  apply("Head", 0, Math.sin(phase) * 0.018 * weight, 0);
}
function hipSway(t) {
  apply("Pelvis", 0, Math.sin(t * 1.8) * 0.12, Math.sin(t * 2.4) * 0.15);
  apply("Waist", 0, -Math.sin(t * 1.8) * 0.1, -Math.sin(t * 2.4) * 0.08);
  apply("Head", 0, Math.sin(t * 0.9) * 0.16, -0.05);
  apply("L_Thigh", 0.06, 0, -0.08);
  apply("R_Thigh", -0.03, 0, 0.08);
}
function pose(t) {
  apply("Pelvis", 0, 0.18, 0.14);
  apply("Waist", -0.05, -0.15, -0.1);
  apply("Spine02", -0.08, -0.1, -0.08);
  apply("Head", -0.08, 0.28, 0.06);
  apply("L_Upperarm", -0.25, 0.15, -0.48);
  apply("L_Forearm", -0.55, 0, -0.35);
  apply("R_Upperarm", 0.15, -0.2, 0.32);
  apply("R_Forearm", -0.75, 0, 0.18);
}
const walkEnd = new THREE.Vector3(BED_CENTER.x + 1.85, 0, BED_CENTER.z);
const standAtBed = new THREE.Vector3(
  BED_CENTER.x,
  0,
  BED_CENTER.z + BED_SIZE.z * 0.5 + 0.48,
);
const seatedAtBed = new THREE.Vector3(
  BED_CENTER.x,
  0.2,
  BED_CENTER.z + BED_SIZE.z * 0.5 - 0.08,
);
function approachBed(amount) {
  const w = smooth(amount);
  character.position.lerpVectors(walkEnd, standAtBed, w);
  character.rotation.y = THREE.MathUtils.lerp(
    MODEL_FORWARD_OFFSET + Math.PI * 0.5,
    MODEL_FORWARD_OFFSET,
    w,
  );
  apply("Head", 0, -0.16 * w, 0.03 * w);
  apply("Pelvis", 0, 0, 0.04 * w);
}
function sit(amount = 1, t = 0) {
  const w = smooth(amount);
  apply("L_Thigh", -1.36 * w, -0.08 * w, -0.2 * w);
  apply("R_Thigh", -1.36 * w, 0.08 * w, 0.2 * w);
  apply("L_Calf", 1.42 * w, 0, 0);
  apply("R_Calf", 1.42 * w, 0, 0);
  apply("L_Foot", -0.18 * w, 0, 0);
  apply("R_Foot", -0.18 * w, 0, 0);
  apply("Pelvis", -0.1 * w, 0, 0);
  apply("Waist", (0.08 + Math.sin(t * 1.2) * 0.012) * w, 0, 0);
  apply("Spine02", -0.04 * w, 0, 0);
  apply("L_Upperarm", -0.22 * w, 0, -0.16 * w);
  apply("R_Upperarm", -0.22 * w, 0, 0.16 * w);
  apply("L_Forearm", -0.25 * w, 0, -0.06 * w);
  apply("R_Forearm", -0.25 * w, 0, 0.06 * w);
  character.position.lerpVectors(standAtBed, seatedAtBed, w);
  character.rotation.y = MODEL_FORWARD_OFFSET;
}
function cameraTease(t) {
  sit(1, t);
  apply("L_Thigh", -1.34, -0.18, -0.34);
  apply("R_Thigh", -1.34, 0.18, 0.34);
  apply("Pelvis", -0.08, Math.sin(t * 1.25) * 0.07, Math.sin(t * 1.7) * 0.055);
  apply("Waist", 0.12, -Math.sin(t * 0.8) * 0.09, 0);
  apply("Spine02", -0.08, Math.sin(t * 0.8) * 0.07, -0.035);
  apply("Head", -0.1, Math.sin(t * 0.72) * 0.2, 0.045);
  apply("R_Upperarm", -0.2, -0.12, 0.27);
  apply("R_Forearm", -0.72 + Math.sin(t * 1.8) * 0.08, 0, 0.2);
}
function wave(t) {
  apply("R_Upperarm", 0, -0.2, 1.7);
  apply("R_Forearm", -0.55, 0, 0.15 + Math.sin(t * 5) * 0.28);
  apply("Head", 0, -0.18, 0.08);
  apply("Pelvis", 0, 0, 0.1);
}

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta(),
    t = clock.elapsedTime;
  controls.update();
  if (mixer) mixer.update(dt);
  if (character && mode !== "afraid") {
    resetRig();
    character.position.set(1.35, baseY, 0);
    character.rotation.set(0, 0, 0);
    let active = mode,
      local = t - modeStarted;
    if (mode === "sequence") {
      const q = Math.min(local, 27.999);
      const cameraGoals = {
        walk: new THREE.Vector3(4.1, 2.35, 4.4),
        approach: new THREE.Vector3(3.1, 2.0, 3.0),
        sit: new THREE.Vector3(2.5, 1.72, 2.35),
        seated: new THREE.Vector3(2.15, 1.55, 2.0),
        camera: new THREE.Vector3(1.75, 1.48, 1.62),
      };
      if (q < 10) {
        active = "walk";
        local = q;
      } else if (q < 13) {
        active = "approach";
        local = q - 10;
      } else if (q < 17) {
        active = "sit";
        local = q - 13;
      } else if (q < 22) {
        active = "seated";
        local = q - 17;
      } else {
        active = "camera";
        local = q - 22;
      }
      camera.position.lerp(cameraGoals[active], 0.025);
      controls.target.lerp(
        active === "sit" || active === "seated" || active === "camera"
          ? new THREE.Vector3(BED_CENTER.x, 1.18, BED_CENTER.z + 0.45)
          : new THREE.Vector3(BED_CENTER.x, 1.05, BED_CENTER.z),
        0.035,
      );
    }
    if (active === "idle") {
      apply("Spine02", Math.sin(t * 1.7) * 0.012, 0, 0);
      apply("Head", 0, Math.sin(t * 0.55) * 0.06, 0);
    }
    if (active === "walk") {
      walk(t);
      const walkLocal = mode === "sequence" ? local : local % 10;
      const a = (clamp01(walkLocal / 10) * Math.PI * 2) % (Math.PI * 2);
      const rx = BED_SIZE.x * 0.5 + 0.8;
      const rz = BED_SIZE.z * 0.5 + 0.75;
      const dx = -rx * Math.sin(a);
      const dz = rz * Math.cos(a);
      character.position.set(
        BED_CENTER.x + rx * Math.cos(a),
        baseY + Math.abs(Math.sin(t * 5.25)) * 0.022,
        BED_CENTER.z + rz * Math.sin(a),
      );
      character.rotation.y = Math.atan2(dx, dz) + MODEL_FORWARD_OFFSET;
    }
    if (active === "approach") approachBed(local / 3);
    if (active === "sway") hipSway(t);
    if (active === "pose") pose(t);
    if (active === "sit") sit(local / 4, t);
    if (active === "seated") sit(1, t);
    if (active === "camera") cameraTease(t);
    if (active === "wave") wave(t);
  }
  renderer.render(scene, camera);
}
animate();
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
