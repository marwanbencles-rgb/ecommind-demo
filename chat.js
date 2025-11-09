// Fond spatial animé
const canvas = document.getElementById("stars");
const ctx = canvas.getContext("2d");
let stars = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  stars = Array.from({ length: 130 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 1.4,
    speed: 0.2 + Math.random() * 0.4
  }));
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#00bfff";
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
    s.y += s.speed;
    if (s.y > canvas.height) s.y = 0;
  });
  requestAnimationFrame(drawStars);
}
drawStars();

// Chat minimaliste
const sendBtn = document.getElementById("sendBtn");
const userInput = document.getElementById("userInput");
const chatZone = document.querySelector(".chat-zone");
const orb = document.querySelector(".orb");

function pulseOrb() {
  orb.style.animation = "orbPulse 0.8s ease-in-out";
  setTimeout(() => orb.style.animation = "orbPulse 5s ease-in-out infinite", 800);
}

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  const msg = document.createElement("div");
  msg.classList.add("chat-message", "user");
  msg.textContent = text;
  chatZone.appendChild(msg);

  userInput.value = "";
  chatZone.scrollTop = chatZone.scrollHeight;

  pulseOrb();
}
