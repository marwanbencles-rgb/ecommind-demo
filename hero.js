const canvas = document.getElementById("orbCanvas");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
window.addEventListener("resize", resize);
resize();

let t = 0;
function draw() {
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // fond sombre du globe
  const base = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2);
  base.addColorStop(0, "rgba(0,0,0,0.6)");
  base.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = base;
  ctx.fillRect(0,0,w,h);

  // lueur bleue pulsante
  const glow = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2);
  const pulse = 0.8 + 0.2 * Math.sin(t * 0.04);
  glow.addColorStop(0, `rgba(0,191,255,${0.9*pulse})`);
  glow.addColorStop(0.3, `rgba(0,191,255,${0.5*pulse})`);
  glow.addColorStop(0.6, `rgba(0,191,255,${0.2*pulse})`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.beginPath();
  ctx.fillStyle = glow;
  ctx.arc(w/2, h/2, w/2.5, 0, Math.PI * 2);
  ctx.fill();

  // ligne circulaire brillante
  ctx.beginPath();
  ctx.strokeStyle = `rgba(0,191,255,${0.6 + 0.3*Math.sin(t*0.04)})`;
  ctx.lineWidth = 2;
  ctx.arc(w/2, h/2, w/2.6, 0, Math.PI*2);
  ctx.stroke();

  t++;
  requestAnimationFrame(draw);
}
draw();
