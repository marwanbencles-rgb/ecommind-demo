// --- Chat minimal ---
const sendBtn = document.getElementById("sendBtn");
const userInput = document.getElementById("userInput");
const chatZone = document.querySelector(".chat-zone");
const orb = document.querySelector(".orb-core");

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
