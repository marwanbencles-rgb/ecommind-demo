// Ecommind OnePage — GSAP + Canvas + Three.js + Pyodide
(() => {
  const $ = (s) => document.querySelector(s);

  /* ======================================================
     BACKGROUND PARTICLES (Canvas)
  ====================================================== */
  const bg = $("#bg");
  const g = bg.getContext("2d");
  let W, H, pts = [], reqBG;

  function size() {
    W = bg.width = innerWidth;
    H = bg.height = innerHeight;
  }
  addEventListener("resize", size); size();

  function initPts(n = 64) {
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 1 + Math.random() * 2.2,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
    }));
  }
  function tickBG() {
    g.clearRect(0, 0, W, H);
    g.fillStyle = css("--blue");
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = "rgba(0,191,255,.12)";
    g.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j];
        const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 < 120 * 120) {
          g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
        }
      }
    }
    reqBG = requestAnimationFrame(tickBG);
  }
  initPts();

  /* ======================================================
     INTRO GSAP
  ====================================================== */
  function intro() {
    if (!window.gsap) { start(); return; }
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".intro-logo", { scale: 0.7, opacity: 0, duration: 0.45 })
      .from(".intro-title", { y: 10, opacity: 0, duration: 0.35 }, "-=0.15")
      .from(".intro-tag", { y: 8, opacity: 0, duration: 0.3 }, "-=0.2")
      .to("#intro", { opacity: 0, duration: 0.5, delay: 0.25, onComplete: () => $("#intro").style.display = "none" })
      .add(start, "-=0.1");
  }

  /* ======================================================
     THREE.JS ORB (reactive to audio)
  ====================================================== */
  let scene, camera, renderer, orb, glow, raf3D;
  function initThree() {
    const wrap = $("#orb-wrap");
    const w = wrap.clientWidth, h = wrap.clientHeight;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.z = 4;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    wrap.innerHTML = "";
    wrap.appendChild(renderer.domElement);

    const light = new THREE.PointLight(0x00bfff, 1.2); light.position.set(2, 2, 3);
    const amb = new THREE.AmbientLight(0x113344, 0.6);
    scene.add(light, amb);

    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x002a3a,
      emissive: 0x003b57,
      shininess: 80,
      specular: 0x003b57,
    });
    orb = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 48), coreMat);
    scene.add(orb);

    const glowMat = new THREE.ShaderMaterial({
      uniforms: { color: { value: new THREE.Color(0x00bfff) }, power: { value: 1.7 } },
      vertexShader: `
        varying float vA;
        void main(){
          vec3 n = normalize(normalMatrix * normal);
          vec3 v = normalize(normalMatrix * -position);
          vA = pow(1.0 - max(dot(n,v), 0.0), 2.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }`,
      fragmentShader: `
        varying float vA; uniform vec3 color; uniform float power;
        void main(){ gl_FragColor = vec4(color, vA*power); }`,
      blending: THREE.AdditiveBlending, transparent: true, side: THREE.FrontSide, depthWrite: false,
    });
    glow = new THREE.Mesh(new THREE.SphereGeometry(1.05, 48, 48), glowMat);
    scene.add(glow);

    const loop = () => {
      orb.rotation.y += 0.005;
      glow.rotation.y += 0.004;
      // scale piloté par l'audio (mis à jour dans drawVoice)
      renderer.render(scene, camera);
      raf3D = requestAnimationFrame(loop);
    };
    loop();

    new ResizeObserver((ents) => {
      for (const e of ents) {
        const w2 = e.contentRect.width, h2 = e.contentRect.height;
        renderer.setSize(w2, h2); camera.aspect = w2 / h2; camera.updateProjectionMatrix();
      }
    }).observe(wrap);

    // exposer pour la voix
    window.orb = orb; window.glow = glow;
  }

  /* ======================================================
     PYODIDE (Python → score de closing)
  ====================================================== */
  let pyodideReady = (async () => {
    if (!window.loadPyodide) return null;
    try {
      const py = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/" });
      const code = `
import numpy as np
def closing_score(leads, sat, response_s):
    x = np.array([leads/3000.0, sat/100.0, max(0.1, 2.0-response_s)/2.0])
    w = np.array([0.55, 0.35, 0.25])
    z = float(np.dot(x, w))
    s = 1.0/(1.0+np.exp(-5*(z-0.5)))
    return round(10.0*s, 1)
`;
      await py.runPythonAsync(code);
      return py;
    } catch (e) {
      return null;
    }
  })();

  async function updateClosingScore() {
    try {
      const py = await pyodideReady; if (!py) return;
      const leads = Number($("#kpiLeads")?.textContent || 2300);
      const sat = 95, rt = 1.2;
      const score = await py.runPythonAsync(`closing_score(${leads}, ${sat}, ${rt})`);
      const el = $("#kpiScore"); if (el) el.textContent = Number(score).toFixed(1);
    } catch { /* silencieux */ }
  }

  /* ======================================================
     MINI CHARTS (Canvas)
  ====================================================== */
  function drawLine() {
    const c = $("#lineChart"); if (!c) return;
    const ctx = c.getContext("2d");
    const W = c.width = c.clientWidth, H = c.height;
    const data = Array.from({ length: 24 }, (_, i) => 20 + Math.sin(i / 3) * 12 + Math.random() * 6);
    const max = Math.max(...data) + 10, min = Math.min(...data) - 10;

    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = css("--blue"); ctx.lineWidth = 2; ctx.beginPath();
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / (max - min)) * H;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = "#001421";
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - ((v - min) / (max - min)) * H;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    });
  }

  function drawBars() {
    const root = $("#bars"); if (!root) return;
    root.innerHTML = "";
    ["Ads", "Mail", "WhatsApp", "Instagram", "Site", "Phone"].forEach(() => {
      const h = 30 + Math.round(Math.random() * 70);
      const bar = document.createElement("div"); bar.className = "bar";
      const fill = document.createElement("div"); fill.className = "fill"; fill.style.height = h + "%";
      bar.appendChild(fill); root.appendChild(bar);
    });
  }

  /* ======================================================
     CHAT typing (visuel)
  ====================================================== */
  async function typeIn(sel, text) {
    const el = document.querySelector(sel); if (!el) return;
    el.textContent = "";
    const words = text.split(" ");
    for (let i = 0; i < words.length; i++) {
      el.textContent += (i ? " " : "") + words[i];
      await wait(24);
    }
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ======================================================
     VOICE visual + pilotage de l’orbe
  ====================================================== */
  const micStart = $("#micStart"), micStop = $("#micStop"), micDot = $("#micDot"), micLabel = $("#micLabel");
  const v = $("#voice"); const vctx = v.getContext("2d");
  let stream, audio, ana, raf, listening = false;

  micStart?.addEventListener("click", async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audio = new (window.AudioContext || window.webkitAudioContext)();
      const src = audio.createMediaStreamSource(stream);
      ana = audio.createAnalyser(); ana.fftSize = 1024; // meilleure précision
      src.connect(ana);
      listening = true; micDot.style.background = css("--blue"); micLabel.textContent = "En écoute";
      drawVoice();
    } catch (e) {
      alert("Micro refusé / indisponible (HTTPS requis).");
    }
  });
  micStop?.addEventListener("click", stopMic);

  function stopMic() {
    if (!listening) return;
    listening = false;
    micDot.style.background = css("--muted"); micLabel.textContent = "Micro inactif";
    if (raf) cancelAnimationFrame(raf);
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (audio) audio.close();
  }

  function drawVoice() {
    const W = (v.width = v.clientWidth), H = v.height;
    const timeF32 = new Float32Array(ana.fftSize);
    const timeU8 = new Uint8Array(ana.fftSize);

    const loop = () => {
      // time domain pour affichage
      ana.getByteTimeDomainData(timeU8);
      vctx.clearRect(0, 0, W, H);
      vctx.lineWidth = 2; vctx.strokeStyle = css("--blue");
      vctx.beginPath();
      for (let i = 0; i < timeU8.length; i++) {
        const x = (i / (timeU8.length - 1)) * W;
        const y = (timeU8[i] / 128.0) * H / 2;
        i ? vctx.lineTo(x, y) : vctx.moveTo(x, y);
      }
      vctx.stroke();

      // JS RMS (fallback rapide) pour piloter l’orbe
      ana.getFloatTimeDomainData(timeF32);
      let peak = 0.0, sum = 0.0;
      for (let i = 0; i < timeF32.length; i++) {
        const v = timeF32[i];
        const a = Math.abs(v);
        if (a > peak) peak = a;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / timeF32.length);                // ~ 0..1
      const crest = rms > 0 ? (peak / rms) : 0.0;                 // typ 1..3
      const peakFactor = Math.max(0, Math.min(1, (crest - 1) / 2)); // 0..1
      const s = 1 + (rms * 1.5 + peakFactor * 0.4);

      if (window.orb && window.glow) {
        window.orb.scale.set(s, s, s);
        window.glow.scale.set(s * 1.03, s * 1.03, s * 1.03);
      }

      if (listening) raf = requestAnimationFrame(loop);
    };
    loop();
  }

  /* ======================================================
     TOGGLES + HELPERS
  ====================================================== */
  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

  $("#fxToggle")?.addEventListener("click", (e) => {
    document.body.classList.toggle("fx-off");
    e.currentTarget.textContent = document.body.classList.contains("fx-off") ? "FX OFF" : "FX ON";
    initPts(document.body.classList.contains("fx-off") ? 24 : 64);
  });

  $("#themeToggle")?.addEventListener("click", () => {
    document.documentElement.classList.toggle("force-light");
    document.documentElement.classList.toggle("force-dark");
  });

  function smoothTo(sel) {
    const el = document.querySelector(sel);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    if (window.gsap) gsap.from(el.closest(".card"), { scale: 0.99, duration: 0.25 });
  }

  /* ======================================================
     START SEQUENCE
  ====================================================== */
  function start() {
    cancelAnimationFrame(reqBG); tickBG();
    if (window.gsap) {
      gsap.from(".top", { y: -20, opacity: 0, duration: 0.5 });
      gsap.from(".hero .card, .kpi, .mod, .banner", { opacity: 0, y: 15, stagger: 0.06, duration: 0.6 });
      gsap.from(["#kpiLeads", "#kpiScore", "#kpiRt", "#kpiSat"], { scale: 0.98, opacity: 0.85, duration: 0.5, stagger: 0.1 });
    }
    drawLine(); drawBars();
    typeIn("#lastMsg .bubble", "OK. Je vous montre comment on capte, qualifie et close en 60s.");
    initThree();
    updateClosingScore();

    $("#ctaChat")?.addEventListener("click", () => smoothTo("#chat"));
    $("#ctaVoice")?.addEventListener("click", () => smoothTo("#voice"));
  }

  // GO
  intro();
})();
