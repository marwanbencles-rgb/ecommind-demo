// ==========================
//  Initialisation orb 3D
// ==========================

function initOrb() {
  const canvas = document.getElementById("orbCanvas");
  if (!canvas || !window.THREE) return;

  const scene = new THREE.Scene();
  scene.background = null;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });

  const orbContainer = canvas.parentElement;
  const rect = orbContainer.getBoundingClientRect();

  const camera = new THREE.PerspectiveCamera(
    35,
    rect.width / rect.height,
    0.1,
    100
  );
  camera.position.set(0, 0, 4);

  renderer.setSize(rect.width, rect.height, false);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));

  // Lumières
  const hemiLight = new THREE.HemisphereLight(0x00bfff, 0x000000, 0.6);
  scene.add(hemiLight);

  const pointLight = new THREE.PointLight(0x00bfff, 1.4, 10);
  pointLight.position.set(2, 2, 3);
  scene.add(pointLight);

  const backLight = new THREE.PointLight(0xc9a55e, 1.0, 10);
  backLight.position.set(-3, -2, -2);
  scene.add(backLight);

  // Sphere principale
  const sphereGeo = new THREE.SphereGeometry(1.1, 64, 64);
  const sphereMat = new THREE.MeshPhysicalMaterial({
    color: 0x047ab7,
    metalness: 0.85,
    roughness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    emissive: 0x0080ff,
    emissiveIntensity: 0.4,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  scene.add(sphere);

  // Anneaux (tors)
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x00bfff,
    metalness: 0.9,
    roughness: 0.25,
    emissive: 0x00bfff,
    emissiveIntensity: 0.2,
  });

  const ring1 = new THREE.Mesh(
    new THREE.TorusGeometry(1.4, 0.02, 16, 100),
    ringMat
  );
  ring1.rotation.x = Math.PI / 2.2;
  scene.add(ring1);

  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(1.1, 0.025, 16, 100),
    ringMat.clone()
  );
  ring2.rotation.x = Math.PI / 2.1;
  ring2.rotation.z = 0.5;
  scene.add(ring2);

  const ring3 = new THREE.Mesh(
    new THREE.TorusGeometry(0.8, 0.02, 16, 100),
    ringMat.clone()
  );
  ring3.rotation.x = Math.PI / 2.1;
  ring3.rotation.z = -0.5;
  scene.add(ring3);

  // Particules
  const particleCount = 220;
  const pos = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const r = 1.6 + Math.random() * 0.8;
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = z;
  }

  const particlesGeo = new THREE.BufferGeometry();
  particlesGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(pos, 3)
  );

  const particlesMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.02,
    transparent: true,
    opacity: 0.8,
  });

  const particles = new THREE.Points(particlesGeo, particlesMat);
  scene.add(particles);

  // Animation boucle
  let lastTime = 0;
  function animate(time) {
    const delta = (time - lastTime) / 1000;
    lastTime = time;

    sphere.rotation.y += delta * 0.35;
    ring1.rotation.z += delta * 0.25;
    ring2.rotation.z -= delta * 0.18;
    ring3.rotation.z += delta * 0.14;
    particles.rotation.y += delta * 0.08;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  // Resize
  window.addEventListener("resize", () => {
    const r = orbContainer.getBoundingClientRect();
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
    renderer.setSize(r.width, r.height, false);
  });
}

// ==========================
//  Animations GSAP
// ==========================

function initCinematic() {
  if (!window.gsap) return;

  gsap.from(".hero-title", {
    y: -20,
    opacity: 0,
    duration: 0.9,
    ease: "power3.out",
  });

  gsap.from(".hero-subtitle", {
    y: -10,
    opacity: 0,
    delay: 0.2,
    duration: 0.8,
    ease: "power3.out",
  });

  gsap.from(".hero-chat-bubble", {
    y: 20,
    opacity: 0,
    delay: 0.45,
    duration: 0.9,
    ease: "power3.out",
  });

  gsap.from(".hero-orb-3d", {
    scale: 0.7,
    opacity: 0,
    delay: 0.7,
    duration: 1.2,
    ease: "power4.out",
  });

  gsap.from(".hero-input-bar", {
    y: 40,
    opacity: 0,
    delay: 1.1,
    duration: 0.9,
    ease: "power3.out",
  });

  const mic = document.querySelector(".hero-input-mic");
  if (mic) {
    mic.addEventListener("click", () => {
      gsap.fromTo(
        mic,
        { boxShadow: "0 0 0px rgba(201,165,94,1)" },
        {
          boxShadow:
            "0 0 26px rgba(201,165,94,1), 0 0 0 1px rgba(201,165,94,0.9)",
          duration: 0.25,
          yoyo: true,
          repeat: 1,
          ease: "power2.out",
        }
      );
    });
  }

  const input = document.querySelector(".hero-input-field");
  if (input) {
    setTimeout(() => {
      input.focus();
    }, 1500);
  }
}

// ==========================
//  BOOT
// ==========================

window.addEventListener("load", () => {
  initOrb();
  initCinematic();
});
