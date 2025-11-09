const canvas = document.getElementById("orbCanvas");
const gl = canvas.getContext("webgl");

// Redimensionne automatiquement
function resize() {
  canvas.width = canvas.offsetWidth * window.devicePixelRatio;
  canvas.height = canvas.offsetHeight * window.devicePixelRatio;
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
}
window.addEventListener("resize", resize);
resize();

// === SHADERS ===
// Vertex shader
const vertexShaderSrc = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// Fragment shader
const fragmentShaderSrc = `
precision mediump float;
varying vec2 vUv;
uniform float time;
void main() {
  vec2 uv = vUv - 0.5;
  float r = length(uv);

  // cœur lumineux pulsant
  float glow = 0.05 / abs(r - 0.25);
  glow += 0.008 / abs(r - 0.15);
  glow += 0.004 / abs(r - 0.35);
  glow *= (1.0 + 0.2 * sin(time * 2.0));

  // rotation douce
  float angle = atan(uv.y, uv.x) + time * 0.4;
  float waves = sin(angle * 8.0 + time * 3.0) * 0.05;

  // teinte bleue
  vec3 color = vec3(0.0, 0.5 + 0.5 * sin(time + r * 5.0), 1.0);
  color *= glow + 0.2 + waves;

  // halo externe
  float halo = smoothstep(0.45, 0.25, r);
  color += vec3(0.0, 0.5, 1.0) * halo * 0.5;

  gl_FragColor = vec4(color, 1.0 - smoothstep(0.45, 0.55, r));
}
`;

// Compile shaders
function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSrc);
const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSrc);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

// Buffer full screen
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -1, -1, 1, -1, -1, 1, 1, 1
]), gl.STATIC_DRAW);

const positionLoc = gl.getAttribLocation(program, "position");
gl.enableVertexAttribArray(positionLoc);
gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

const timeLoc = gl.getUniformLocation(program, "time");

// === ANIMATION ===
function render(t) {
  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform1f(timeLoc, t * 0.001);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
