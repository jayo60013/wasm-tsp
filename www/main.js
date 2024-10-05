import { initWasm } from "./wasm.js";
import { setupCanvas, setupEventListeners, resizeCanvas } from "./canvas.js";
import { createShaderProgram } from "./shaders.js";
import { draw } from "./tsp-gl.js";
import { initPoints } from "./utils.js";

const NUM_POINTS = 500;
const RADIUS_SIZE = 0.006;

async function run() {
  const {
    initialisePoints,
    getPointOrder,
    memory,
    wasmMemory
  } = await initWasm(NUM_POINTS);

  const pointsPtr = initialisePoints(NUM_POINTS, Date.now());
  let pointArray = new Float32Array(memory.buffer, pointsPtr, NUM_POINTS * 2);
  let points = initPoints(pointArray);

  const pointOrderPtr = getPointOrder(pointsPtr, NUM_POINTS);
  let pointOrder = new Int32Array(memory.buffer, pointOrderPtr, NUM_POINTS);

  const canvas = document.getElementById("tsp-canvas");
  const gl = canvas.getContext("webgl2");

  const vertexCode = `
  attribute vec2 a_position;
  void main(void) {
      gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

  const fragCode = `
  precision mediump float;

  uniform vec2 u_resolution;
  uniform vec2 u_centers[${NUM_POINTS}];
  
  void main() {
      vec2 position = gl_FragCoord.xy / u_resolution;
      float aspect = u_resolution.x / u_resolution.y;
      vec2 scaledPosition = vec2(position.x * aspect, position.y);
      float radius = ${RADIUS_SIZE};

      for (int i = 0; i < ${NUM_POINTS}; i++) {
          vec2 center = u_centers[i];
          vec2 scaledCenter = vec2(center.x * aspect, center.y);
          float distance = length(scaledPosition - scaledCenter) * (1.0 / aspect);

          if (distance <= radius) {
              gl_FragColor = vec4(0.5, center, 1.0);
              return;
          }
      }

    gl_FragColor = vec4(0.1, 0.1, 0.1, 1.0);
  }
  `;

  const lineFragCode = `
    precision mediump float;

    void main(void) {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
    `;

  const program = createShaderProgram(gl, vertexCode, fragCode);
  const lineProgram = createShaderProgram(gl, vertexCode, lineFragCode);

  const { aspectRatio } = setupCanvas(gl, canvas);
  resizeCanvas(gl, canvas, program, aspectRatio);

  const positionBuffer = gl.createBuffer();
  const lineBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const positions = [-1, -1, 3, -1, -1, 3];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  const isDragging = { current: -1 };

  setupEventListeners(canvas, points, isDragging, (e) => {
    if (isDragging.current === -1) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    points[isDragging.current].cx = (e.clientX - rect.left) / rect.width;
    points[isDragging.current].cy = 1 - (e.clientY - rect.top) / rect.height;

    pointArray = new Float32Array(memory.buffer, pointsPtr, NUM_POINTS * 2);
    for (let i = 0; i < points.length; i++) {
      pointArray[i * 2] = points[i].cx;
      pointArray[i * 2 + 1] = points[i].cy;
    }

    const pointOrderPtr = getPointOrder(pointsPtr, NUM_POINTS);
    pointOrder = new Int32Array(memory.buffer, pointOrderPtr, NUM_POINTS);

    draw(gl, points, program, lineProgram, positionBuffer, lineBuffer, pointOrder, aspectRatio);
  }, RADIUS_SIZE);

  window.addEventListener("resize", () => {
    resizeCanvas(gl, canvas, program, aspectRatio);
    draw(gl, points, program, lineProgram, positionBuffer, lineBuffer, pointOrder, aspectRatio);
  });

  draw(gl, points, program, lineProgram, positionBuffer, lineBuffer, pointOrder, aspectRatio);
}

run();
