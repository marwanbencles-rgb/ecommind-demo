/* ============================================================
   ORB 3D + PARTICLES (TA VERSION ORIGINALE)
   ============================================================ */

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

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    document.getElementById('container').appendChild(renderer.domElement);

    camera.position.z = 25;

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

        const depth = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z) / 8;

        const color = new THREE.Color();
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
        sizeAttenuation: true,
    });

    particles = new THREE.Points(geometry, material);
    particles.rotation.set(0, 0, 0);
    scene.add(particles);
}

/* ============================================================
   CHAT + FLUX ÉNERGÉTIQUE
   ============================================================ */

function addMessage(author, text) {
    const chat = document.getElementById("chatMessages");
    if (!chat) return;

    const msg = document.createElement("div");
    msg.className =
        "chat-message " +
        (author === "user" ? "chat-message-user" : "chat-message-assistant");

    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    bubble.textContent = text;

    msg.appendChild(bubble);
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
}

function startEnergyFlow(text) {
    const fxLayer = document.querySelector(".fx-layer");
    const orb = document.getElementById("container");
    const chatPanel = document.querySelector(".chat-panel");

    const orbRect = orb.getBoundingClientRect();
    const chatRect = chatPanel.getBoundingClientRect();

    const startX = orbRect.left + orbRect.width / 2;
    const startY = orbRect.top + orbRect.height / 2;

    const endX = chatRect.left + 40;
    const endY = chatRect.top + 40;

    const orbFx = document.createElement("div");
    orbFx.className = "energy-orb";
    orbFx.style.left = `${startX}px`;
    orbFx.style.top = `${startY}px`;

    fxLayer.appendChild(orbFx);

    gsap.to(orbFx, {
        duration: 0.5,
        x: endX - startX,
        y: endY - startY,
        ease: "power2.out",
        onComplete: () => {
            orbFx.remove();
            chatPanel.classList.add("flash");

            setTimeout(() => chatPanel.classList.remove("flash"), 250);

            addMessage("user", text);

            setTimeout(() => {
                addMessage(
                    "assistant",
                    "Reçu. Je peux automatiser ça pour vous."
                );
            }, 250);
        }
    });
}

/* ============================================================
   MORPHING DU TEXTE → ORB → CERCLE
   ============================================================ */

function setupEventListeners() {
    const btn = document.getElementById("typeBtn");
    const input = document.getElementById("morphText");

    function handleSend() {
        const text = input.value.trim();
        if (!text) return;

        startEnergyFlow(text);
        morphToText(text);
        input.value = "";
    }

    btn.addEventListener("click", handleSend);

    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleSend();
    });
}

function createTextPoints(text) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const fontSize = 100;
    const padding = 20;

    ctx.font = `bold ${fontSize}px Arial`;
    const metrics = ctx.measureText(text);

    canvas.width = metrics.width + padding * 2;
    canvas.height = fontSize + padding * 2;

    ctx.fillStyle = "white";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    const points = [];
    const threshold = 128;

    for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] > threshold && Math.random() < 0.3) {
            const x = (i / 4) % canvas.width;
            const y = Math.floor(i / 4 / canvas.width);

            points.push({
                x: (x - canvas.width / 2) / (fontSize / 10),
                y: -(y - canvas.height / 2) / (fontSize / 10),
            });
        }
    }

    return points;
}

function morphToText(text) {
    currentState = "text";
    const points = createTextPoints(text);

    const positions = particles.geometry.attributes.position.array;
    const target = new Float32Array(count * 3);

    gsap.to(particles.rotation, {
        x: 0, y: 0, z: 0,
        duration: 0.6
    });

    for (let i = 0; i < count; i++) {
        if (i < points.length) {
            target[i * 3] = points[i].x;
            target[i * 3 + 1] = points[i].y;
            target[i * 3 + 2] = 0;
        } else {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 20 + 10;
            target[i * 3] = Math.cos(angle) * radius;
            target[i * 3 + 1] = Math.sin(angle) * radius;
            target[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
    }

    for (let i = 0; i < positions.length; i += 3) {
        gsap.to(positions, {
            [i]: target[i],
            [i + 1]: target[i + 1],
            [i + 2]: target[i + 2],
            duration: 2,
            ease: "power2.inOut",
            onUpdate: () => {
                particles.geometry.attributes.position.needsUpdate = true;
            }
        });
    }

    setTimeout(morphToCircle, 3500);
}

function morphToCircle() {
    currentState = "sphere";

    const positions = particles.geometry.attributes.position.array;
    const colors = particles.geometry.attributes.color.array;

    const target = new Float32Array(count * 3);

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

        target[i * 3] = p.x + (Math.random() - 0.5) * 0.5;
        target[i * 3 + 1] = p.y + (Math.random() - 0.5) * 0.5;
        target[i * 3 + 2] = p.z + (Math.random() - 0.5) * 0.5;

        const depth = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z) / 8;

        const color = new THREE.Color();
        color.setHSL(0.5 + depth * 0.2, 0.7, 0.4 + depth * 0.3);

        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    for (let i = 0; i < positions.length; i += 3) {
        gsap.to(positions, {
            [i]: target[i],
            [i + 1]: target[i + 1],
            [i + 2]: target[i + 2],
            duration: 2,
            ease: "power2.inOut",
            onUpdate: () => {
                particles.geometry.attributes.position.needsUpdate = true;
            }
        });
    }

    gsap.to(colors, {
        duration: 2,
        ease: "power2.inOut",
        onUpdate: () => {
            particles.geometry.attributes.color.needsUpdate = true;
        }
    });
}

/* ============================================================
   ANIMATION PRINCIPALE
   ============================================================ */

function animate() {
    requestAnimationFrame(animate);

    if (currentState === "sphere") {
        particles.rotation.y += 0.002;
    }

    renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
