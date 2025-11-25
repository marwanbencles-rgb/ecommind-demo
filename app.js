/* ============================================================
   ORB 3D — ECOMMIND
============================================================ */

let scene, camera, renderer, particles;
const count = 12000;
let currentState = "sphere";

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000);
  document.getElementById("container").appendChild(renderer.domElement);

  camera.position.z = 25;

  createParticles();
  setupEventListeners();
  animate();
}

/* ============================================================
   PARTICULES GÉNÉRALES
============================================================ */

function createParticles() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  function sphericalDistribution(i) {
    const phi = Math.acos(-1 + (2 * i) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;

    return {
      x: 8 * Math.cos(theta) * Math.sin(phi),
      y: 8 * Math.sin(theta) * Math.sin(phi),
      z: 8 * Math.cos(phi),
    };
  }

  for (let i = 0; i < count; i++) {
    const p = sphericalDistribution(i);

    positions[i * 3] = p.x + (Math.random() - 0.5) * 0.5;
    positions[i * 3 + 1] = p.y + (Math.random() - 0.5) * 0.5;
    positions[i * 3 + 2] = p.z + (Math.random() - 0.5) * 0.5;

    const color = new THREE.Color();
    const depth = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z) / 8;
    color.setHSL(0.55 + depth * 0.2, 0.7, 0.45 + depth * 0.3);

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
  });

  if (particles) scene.remove(particles);

  particles = new THREE.Points(geometry, material);
  scene.add(particles);
}

/* ============================================================
   EVENTS
============================================================ */

function setupEventListeners() {
  const typeBtn = document.getElementById("typeBtn");
  const input = document.getElementById("morphText");

  typeBtn.addEventListener("click", () => handleInput());
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleInput();
  });
}

function handleInput() {
  const input = document.getElementById("morphText");
  const text = input.value.trim();
  if (!text) return;

  addUserMessage(text);
  morphToText(text);

  // Option : cacher le chat pendant l’animation
  hideChatTemporarily();

  input.value = "";
}

/* ============================================================
   CHAT (AJOUT MESSAGES)
============================================================ */

function addUserMessage(text) {
  const zone = document.getElementById("chatMessages");

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";
  bubble.style.background = "rgba(0,191,255,0.25)";

  bubble.textContent = text;

  const wrap = document.createElement("div");
  wrap.className = "chat-message";
  wrap.appendChild(bubble);

  zone.appendChild(wrap);
  zone.scrollTop = zone.scrollHeight;
}

/* ============================================================
   EFFET DISSIMULATION TEMPORAIRE DU CHAT
============================================================ */

function hideChatTemporarily() {
  const wrapper = document.querySelector(".chat-wrapper");

  wrapper.style.opacity = "0";
  wrapper.style.pointerEvents = "none";

  setTimeout(() => {
    wrapper.style.opacity = "1";
    wrapper.style.pointerEvents = "auto";
  }, 2800); // durée synchro animation
}

/* ============================================================
   TEXTE → POINTS
============================================================ */

function createTextPoints(text) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const fontSize = 120;
  ctx.font = `bold ${fontSize}px Arial`;

  const metrics = ctx.measureText(text);
  canvas.width = metrics.width + 40;
  canvas.height = fontSize + 40;

  ctx.fillStyle = "white";
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = img.data;
  const points = [];

  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i] > 150 && Math.random() < 0.28) {
      const x = (i / 4) % canvas.width;
      const y = Math.floor(i / 4 / canvas.width);

      points.push({
        x: (x - canvas.width / 2) / 10,
        y: -(y - canvas.height / 2) / 10,
      });
    }
  }

  return points;
}

/* ============================================================
   MORPH → TEXTE
============================================================ */

function morphToText(text) {
  currentState = "text";
  const target = createTextPoints(text);

  const positions = particles.geometry.attributes.position.array;
  const newPos = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    if (i < target.length) {
      newPos[i * 3] = target[i].x;
      newPos[i * 3 + 1] = target[i].y;
      newPos[i * 3 + 2] = 0;
    } else {
      const angle = Math.random() * Math.PI * 2;
      newPos[i * 3] = Math.cos(angle) * 20;
      newPos[i * 3 + 1] = Math.sin(angle) * 20;
      newPos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
  }

  for (let i = 0; i < positions.length; i += 3) {
    gsap.to(positions, {
      [i]: newPos[i],
      [i + 1]: newPos[i + 1],
      [i + 2]: newPos[i + 2],
      duration: 1.6,
      ease: "power2.inOut",
      onUpdate: () => (particles.geometry.attributes.position.needsUpdate = true),
    });
  }

  setTimeout(() => morphToSphere(), 2200);
}

/* ============================================================
   MORPH → SPHERE
============================================================ */

function morphToSphere() {
  currentState = "sphere";

  const positions = particles.geometry.attributes.position.array;
  const newPos = new Float32Array(count * 3);

  function distrib(i) {
    const phi = Math.acos(-1 + (2 * i) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;

    return {
      x: 8 * Math.cos(theta) * Math.sin(phi),
      y: 8 * Math.sin(theta) * Math.sin(phi),
      z: 8 * Math.cos(phi),
    };
  }

  for (let i = 0; i < count; i++) {
    const p = distrib(i);
    newPos[i * 3] = p.x;
    newPos[i * 3 + 1] = p.y;
    newPos[i * 3 + 2] = p.z;
  }

  for (let i = 0; i < positions.length; i += 3) {
    gsap.to(positions, {
      [i]: newPos[i],
      [i + 1]: newPos[i + 1],
      [i + 2]: newPos[i + 2],
      duration: 1.8,
      ease: "power2.inOut",
      onUpdate: () => (particles.geometry.attributes.position.needsUpdate = true),
    });
  }
}

/* ============================================================
   ANIMATION DE LA SPHÈRE
============================================================ */

function animate() {
  requestAnimationFrame(animate);

  if (currentState === "sphere") {
    particles.rotation.y += 0.0028;
  }

  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
