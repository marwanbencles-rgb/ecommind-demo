// Ecommind OnePage — GSAP + Canvas + Three.js orb (reactive audio)
(() => {
  const $ = s => document.querySelector(s);

  // ---------- Particles background ----------
  const canvas = $('#bg'); const ctx = canvas.getContext('2d');
  let W, H, particles = [], req;
  function resize(){ W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
  addEventListener('resize', resize); resize();
  function initParticles(n=64){
    particles = Array.from({length:n}, ()=>({x:Math.random()*W,y:Math.random()*H,r:1+Math.random()*2.2,vx:(Math.random()-.5)*.6,vy:(Math.random()-.5)*.6}));
  }
  function step(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = css('--blue');
    for(const p of particles){
      p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>W) p.vx*=-1; if(p.y<0||p.y>H) p.vy*=-1;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    }
    ctx.strokeStyle='rgba(0,191,255,.12)'; ctx.lineWidth=1;
    for(let i=0;i<particles.length;i++) for(let j=i+1;j<particles.length;j++){
      const a=particles[i], b=particles[j], dx=a.x-b.x, dy=a.y-b.y, d2=dx*dx+dy*dy;
      if(d2<120*120){ ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
    }
    req = requestAnimationFrame(step);
  }
  initParticles();

  // ---------- Three.js ORB ----------
  let scene, camera, renderer, orb, glow, raf3d, analyserForOrb=null;
  function initThree(){
    const wrap = $('#orb-wrap');
    const w = wrap.clientWidth, h = wrap.clientHeight;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, w/h, 0.1, 100); camera.position.z = 4;

    renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
    renderer.setSize(w,h); renderer.setPixelRatio(Math.min(2, devicePixelRatio||1));
    wrap.innerHTML=''; wrap.appendChild(renderer.domElement);

    const light = new THREE.PointLight(0x00bfff, 1.2); light.position.set(2,2,3);
    const amb = new THREE.AmbientLight(0x113344, .6);
    scene.add(light, amb);

    // Core
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x002a3a,
      emissive: 0x003b57,
      shininess: 80,
      specular: 0x003b57
    });
    orb = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 48), coreMat);
    scene.add(orb);

    // Fresnel glow
    const glowMat = new THREE.ShaderMaterial({
      uniforms:{
        color:{value:new THREE.Color(0x00bfff)},
        power:{value:1.7}
      },
      vertexShader:`varying float vA; void main(){
        vec3 n = normalize(normalMatrix * normal);
        vec3 v = normalize(normalMatrix * -position);
        vA = pow(1.0 - max(dot(n,v), 0.0), 2.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }`,
      fragmentShader:`varying float vA; uniform vec3 color; uniform float power;
        void main(){ gl_FragColor = vec4(color, vA*power); }`,
      blending: THREE.AdditiveBlending, transparent: true, side: THREE.FrontSide, depthWrite:false
    });
    glow = new THREE.Mesh(new THREE.SphereGeometry(1.05, 48, 48), glowMat);
    scene.add(glow);

    // Animate
    const tick = () => {
      // subtle rotation
      orb.rotation.y += 0.005; glow.rotation.y += 0.004;
      // audio reactive scale if analyser exists
      if (analyserForOrb){
        const arr = new Uint8Array(analyserForOrb.frequencyBinCount);
        analyserForOrb.getByteFrequencyData(arr);
        const avg = arr.reduce((a,b)=>a+b,0)/arr.length/255; // 0..1
        const s = 1 + avg*0.25;
        orb.scale.set(s,s,s); glow.scale.set(s*1.03,s*1.03,s*1.03);
      }
      renderer.render(scene, camera);
      raf3d = requestAnimationFrame(tick);
    };
    tick();

    // resize observer
    new ResizeObserver(entries=>{
      for(const e of entries){
        const w2 = e.contentRect.width, h2 = e.contentRect.height;
        renderer.setSize(w2,h2); camera.aspect = w2/h2; camera.updateProjectionMatrix();
      }
    }).observe(wrap);
  }

  // ---------- Intro GSAP ----------
  function intro(){
    if(!window.gsap){ start(); return; }
    const tl = gsap.timeline({defaults:{ease:'power3.out'}});
    tl.from('.intro-logo', {scale:.7, opacity:0, duration:.45})
      .from('.intro-title', {y:10, opacity:0, duration:.35}, '-=0.15')
      .from('.intro-tag', {y:8, opacity:0, duration:.3}, '-=0.2')
      .to('#intro', {opacity:0, duration:.5, delay:.25, onComplete:()=>$('#intro').style.display='none'})
      .add(start, '-=0.1');
  }

  // ---------- Start ----------
  function start(){
    cancelAnimationFrame(req); step();  // particles
    if (window.gsap){
      gsap.from('.top', {y:-20, opacity:0, duration:.5});
      gsap.from('.hero .card, .kpi, .mod, .banner', {opacity:0, y:15, stagger:.06, duration:.6});
      gsap.from(['#kpiLeads','#kpiScore','#kpiRt','#kpiSat'], {scale:.98, opacity:.85, duration:.5, stagger:.1});
    }
    drawLine(); drawBars(); typeIn('#lastMsg .bubble', "OK. Je vous montre comment on capte, qualifie et close en 60s.");
    initThree();
    $('#ctaChat')?.addEventListener('click', ()=> smoothTo('#chat'));
    $('#ctaVoice')?.addEventListener('click', ()=> smoothTo('#voice'));
  }

  // ---------- Helpers ----------
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  function smoothTo(sel){ const el=$(sel); if(!el) return; el.scrollIntoView({behavior:'smooth',block:'center'}); if(window.gsap) gsap.from(el.closest('.card'),{scale:.99,duration:.25}); }
  const wait = ms => new Promise(r=>setTimeout(r,ms));
  async function typeIn(sel, text){ const el=$(sel); if(!el) return; el.textContent=''; const parts=text.split(' '); for(let i=0;i<parts.length;i++){ el.textContent += (i?' ':'')+parts[i]; await wait(24);} }

  // ---------- Line chart ----------
  function drawLine(){
    const c = $('#lineChart'); if(!c) return; const ctx = c.getContext('2d');
    const W = c.width = c.clientWidth, H = c.height;
    const data = Array.from({length:24}, (_,i)=> 20 + Math.sin(i/3)*12 + Math.random()*6);
    const max = Math.max(...data)+10, min = Math.min(...data)-10;
    ctx.clearRect(0,0,W,H);
    ctx.strokeStyle = css('--blue'); ctx.lineWidth=2; ctx.beginPath();
    data.forEach((v,i)=>{ const x=(i/(data.length-1))*W; const y=H-((v-min)/(max-min))*H; i?ctx.lineTo(x,y):ctx.moveTo(x,y); });
    ctx.stroke();
    ctx.fillStyle = '#001421';
    data.forEach((v,i)=>{ const x=(i/(data.length-1))*W; const y=H-((v-min)/(max-min))*H; ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill(); });
  }

  // ---------- Bars ----------
  function drawBars(){
    const root = $('#bars'); if(!root) return; root.innerHTML='';
    ['Ads','Mail','WhatsApp','Instagram','Site','Phone'].forEach(_=>{
      const h = 30 + Math.round(Math.random()*70);
      const bar = document.createElement('div'); bar.className='bar';
      const fill = document.createElement('div'); fill.className='fill'; fill.style.height=h+'%';
      bar.appendChild(fill); root.appendChild(bar);
    });
  }

  // ---------- Voice visual + link to orb ----------
  const micStart=$('#micStart'), micStop=$('#micStop'), micDot=$('#micDot'), micLabel=$('#micLabel');
  const v=$('#voice'); const vctx=v.getContext('2d'); let stream, audio, ana, raf, listening=false;

  micStart?.addEventListener('click', async ()=>{
    try{
      stream = await navigator.mediaDevices.getUserMedia({audio:true});
      audio = new (window.AudioContext||window.webkitAudioContext)();
      const src = audio.createMediaStreamSource(stream); ana = audio.createAnalyser(); ana.fftSize=512; src.connect(ana);
      listening=true; micDot.style.background = css('--blue'); micLabel.textContent='En écoute';
      analyserForOrb = ana; // ← y relie l’orbe
      drawVoice();
    }catch(e){ alert('Micro refusé / indisponible (HTTPS requis).'); }
  });
  micStop?.addEventListener('click', stopMic);

  function stopMic(){
    if(!listening) return;
    listening=false; micDot.style.background=css('--muted'); micLabel.textContent='Micro inactif';
    analyserForOrb=null;
    if(raf) cancelAnimationFrame(raf);
    if(stream) stream.getTracks().forEach(t=>t.stop());
    if(audio) audio.close();
  }
  function drawVoice(){
    const W=v.width=v.clientWidth, H=v.height;
    const buf=new Uint8Array(ana.frequencyBinCount);
    const loop=()=>{
      ana.getByteTimeDomainData(buf);
      vctx.clearRect(0,0,W,H);
      vctx.lineWidth=2; vctx.strokeStyle=css('--blue'); vctx.beginPath();
      for(let i=0;i<buf.length;i++){ const x=(i/(buf.length-1))*W, y=(buf[i]/128.0)*H/2; i?vctx.lineTo(x,y):vctx.moveTo(x,y); }
      vctx.stroke();
      if(listening) raf=requestAnimationFrame(loop);
    };
    loop();
  }

  // ---------- Toggles ----------
  $('#fxToggle')?.addEventListener('click', (e)=>{
    document.body.classList.toggle('fx-off');
    e.currentTarget.textContent = document.body.classList.contains('fx-off') ? 'FX OFF' : 'FX ON';
    initParticles(document.body.classList.contains('fx-off')?24:64);
  });
  $('#themeToggle')?.addEventListener('click', ()=>{
    document.documentElement.classList.toggle('force-light');
    document.documentElement.classList.toggle('force-dark');
  });

  // Kick
  intro();
})();
