let scene, camera, renderer, particles;
const count = 12000;
let currentState = 'sphere';

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  document.getElementById('container').appendChild(renderer.domElement);

  // On recule légèrement la caméra pour mieux voir le texte
  camera.position.z = 27;

  createParticles();
  setupEventListeners();
  animate();
}

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
      z: 8 * Math.cos(phi)
    };
  }

  for (let i = 0; i < count; i++) {
    const point = sphericalDistribution(i);

    positions[i * 3] = point.x + (Math.random() - 0.5) * 0.5;
    positions[i * 3 + 1] = point.y + (Math.random() - 0.5) * 0.5;
    positions[i * 3 + 2] = point.z + (Math.random() - 0.5) * 0.5;

    const color = new THREE.Color();
    const depth =
      Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z) / 8;
    color.setHSL(0.5 + depth * 0.2, 0.7, 0.4 + depth * 0.3);

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });

  if (particles) scene.remove(particles);
  particles = new THREE.Points(geometry, material);
  particles.rotation.x = 0;
  particles.rotation.y = 0;
  particles.rotation.z = 0;
  scene.add(particles);
}

function setupEventListeners() {
  const typeBtn = document.getElementById('typeBtn');
  const input = document.getElementById('morphText');

  function handleSend() {
    const text = input.value.trim();
    if (!text) return;

    addUserMessage(text);
    triggerOrbWithHide(text);
    input.value = '';
  }

  typeBtn.addEventListener('click', handleSend);

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

/* Ajoute le message utilisateur dans le chat */
function addUserMessage(text) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'chat-message chat-message-user';

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.textContent = text;

  wrapper.appendChild(bubble);
  chatMessages.appendChild(wrapper);

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/* Cache le chat, lance l’animation de l’orbe, puis réaffiche le chat */
function triggerOrbWithHide(text) {
  const chatZone = document.querySelector('.chat-zone');

  if (chatZone) {
    chatZone.classList.add('chat-hidden');
  }

  morphToText(text);

  // Temps total de l’animation (texte + retour sphère)
  const totalDurationMs = 6000;

  setTimeout(() => {
    if (chatZone) {
      chatZone.classList.remove('chat-hidden');
    }
  }, totalDurationMs);
}

/* =========================
   Génération des points du texte
   Texte toujours à l’échelle dans l’orbe
   ========================= */

function createTextPoints(text) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // 1) Font dynamique : plus le texte est long, plus la taille baisse
  const baseSize = 140;
  const minSize = 48;
  const fontSize = Math.max(minSize, baseSize - text.length * 2.5);

  const padding = 40;

  ctx.font = `bold ${fontSize}px Arial`;
  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;
  const textHeight = fontSize;

  canvas.width = textWidth + padding * 2;
  canvas.height = textHeight + padding * 2;

  ctx.fillStyle = 'white';
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const points = [];
  const threshold = 128;

  // 2) Mapping intelligent : on adapte la largeur max du texte dans la scène
  const targetWorldWidth = 16; // largeur max du texte en unités 3D
  const scale = targetWorldWidth / canvas.width;

  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i] > threshold) {
      const x = (i / 4) % canvas.width;
      const y = Math.floor(i / 4 / canvas.width);

      if (Math.random() < 0.35) {
        points.push({
          x: (x - canvas.width / 2) * scale,
          y: -(y - canvas.height / 2) * scale
        });
      }
    }
  }

  return points;
}

function morphToText(text) {
  currentState = 'text';
  const textPoints = createTextPoints(text);
  const positions = particles.geometry.attributes.position.array;
  const targetPositions = new Float32Array(count * 3);

  gsap.to(particles.rotation, {
    x: 0,
    y: 0,
    z: 0,
    duration: 0.5
  });

  for (let i = 0; i < count; i++) {
    if (i < textPoints.length) {
      targetPositions[i * 3] = textPoints[i].x;
      targetPositions[i * 3 + 1] = textPoints[i].y;
      targetPositions[i * 3 + 2] = 0;
    } else {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 20 + 10;
      targetPositions[i * 3] = Math.cos(angle) * radius;
      targetPositions[i * 3 + 1] = Math.sin(angle) * radius;
      targetPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
  }

  for (let i = 0; i < positions.length; i += 3) {
    gsap.to(particles.geometry.attributes.position.array, {
      [i]: targetPositions[i],
      [i + 1]: targetPositions[i + 1],
      [i + 2]: targetPositions[i + 2],
      duration: 2,
      ease: 'power2.inOut',
      onUpdate: () => {
        particles.geometry.attributes.position.needsUpdate = true;
      }
    });
  }

  setTimeout(() => {
    morphToCircle();
  }, 4000);
}

function morphToCircle() {
  currentState = 'sphere';
  const positions = particles.geometry.attributes.position.array;
  const targetPositions = new Float32Array(count * 3);
  const colors = particles.geometry.attributes.color.array;

  function sphericalDistribution(i) {
    const phi = Math.acos(-1 + (2 * i) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;

    return {
      x: 8 * Math.cos(theta) * Math.sin(phi),
      y: 8 * Math.sin(theta) * Math.sin(phi),
      z: 8 * Math.cos(phi)
    };
  }

  for (let i = 0; i < count; i++) {
    const point = sphericalDistribution(i);

    targetPositions[i * 3] =
      point.x + (Math.random() - 0.5) * 0.5;
    targetPositions[i * 3 + 1] =
      point.y + (Math.random() - 0.5) * 0.5;
    targetPositions[i * 3 + 2] =
      point.z + (Math.random() - 0.5) * 0.5;

    const depth =
      Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z) /
      8;
    const color = new THREE.Color();
    color.setHSL(0.5 + depth * 0.2, 0.7, 0.4 + depth * 0.3);

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  for (let i = 0; i < positions.length; i += 3) {
    gsap.to(particles.geometry.attributes.position.array, {
      [i]: targetPositions[i],
      [i + 1]: targetPositions[i + 1],
      [i + 2]: targetPositions[i + 2],
      duration: 2,
      ease: 'power2.inOut',
      onUpdate: () => {
        particles.geometry.attributes.position.needsUpdate = true;
      }
    });
  }

  for (let i = 0; i < colors.length; i += 3) {
    gsap.to(particles.geometry.attributes.color.array, {
      [i]: colors[i],
      [i + 1]: colors[i + 1],
      [i + 2]: colors[i + 2],
      duration: 2,
      ease: 'power2.inOut',
      onUpdate: () => {
        particles.geometry.attributes.color.needsUpdate = true;
      }
    });
  }
}

function animate() {
  requestAnimationFrame(animate);

  if (currentState === 'sphere') {
    particles.rotation.y += 0.002;
  }

  renderer.render(scene, camera);
}

init();
