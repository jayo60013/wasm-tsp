const NUM_POINTS = 50;
const RADIUS_SIZE = 0.01;
var points;
var pointArray;
var pointOrder;


function initPoints(points) {
  let cs = [];
  for (let i = 0; i < points.length; i += 2) {
    cs.push(new Point(points[i], points[i + 1]));
  }
  return cs;
}

async function run() {
  let wasmMemory = new WebAssembly.Memory({
    initial: 256,
    maximum: 256
  });

  let importObject = {
    env: {
      memory: wasmMemory,
    }
  };

  const response = await fetch("../main.wasm");
  const wasmModule = await WebAssembly.instantiateStreaming(response, importObject);
  const { initialisePoints, getPointOrder, memory } = wasmModule.instance.exports;

  const pointsPtr = initialisePoints(NUM_POINTS);
  pointArray = new Float32Array(memory.buffer, pointsPtr, NUM_POINTS * 2);
  points = initPoints(pointArray);

  const pointOrderPtr = getPointOrder(pointsPtr, NUM_POINTS);
  pointOrder = new Int32Array(memory.buffer, pointOrderPtr, NUM_POINTS);

  window.addEventListener("mousemove", (event) => {
    pointArray = new Float32Array(memory.buffer, pointsPtr, NUM_POINTS * 2);

    for (let i = 0; i < points.length; i++) {
      pointArray[i * 2] = points[i].cx;
      pointArray[i * 2 + 1] = points[i].cy;
    }

    const pointOrderPtr = getPointOrder(pointsPtr, NUM_POINTS);
    pointOrder = new Int32Array(memory.buffer, pointOrderPtr, NUM_POINTS);
  })
}

run().catch(console.error).then(theRest);

function theRest() {
  console.log(pointArray);
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

      for (int i = 0; i < ${NUM_POINTS}; i++) {
          vec2 center = u_centers[i];
          float radius = ${RADIUS_SIZE};
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


  function updatePoints() {
    const tmp = [];
    for (let i = 0; i < points.length; i++) {
      tmp[i * 2] = points[i].cx;
      tmp[i * 2 + 1] = points[i].cy;
    }
    pointArray = new Float32Array(tmp);
  }

  function updateLines() {
    const lineVertices = [];
    for (let i = 0; i < pointOrder.length - 1; i++) {
      const j = pointOrder[i];
      const k = pointOrder[i + 1];
      lineVertices.push(points[j].cx * 2 - 1, points[j].cy * 2 - 1);
      lineVertices.push(points[k].cx * 2 - 1, points[k].cy * 2 - 1);
    }
    return new Float32Array(lineVertices);
  }

  function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexCode);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragCode);

  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const lineVertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexCode);
  const lineFragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, lineFragCode);

  const lineProgram = gl.createProgram();

  gl.attachShader(lineProgram, lineVertexShader);
  gl.attachShader(lineProgram, lineFragmentShader);
  gl.linkProgram(lineProgram);

  lineBuffer = gl.createBuffer();

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const positions = [-1, -1, 3, -1, -1, 3];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

  const resolutionUniformLocation = gl.getUniformLocation(
    program,
    "u_resolution"
  );

  gl.useProgram(program);

  canvas.width = canvas.clientWidth * window.devicePixelRatio;
  canvas.height = canvas.clientHeight * window.devicePixelRatio;
  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);

  let isDragging = -1;
  let aspectRatio = canvas.width / canvas.height;

  function updateCircleUniforms() {
    const centerArray = new Float32Array(NUM_POINTS * 2);
    const radiusArray = new Float32Array(NUM_POINTS);

    points.forEach((point, i) => {
      centerArray[i * 2] = point.cx;
      centerArray[i * 2 + 1] = point.cy;
    });

    gl.uniform2fv(gl.getUniformLocation(program, "u_centers"), centerArray);
    gl.uniform1fv(gl.getUniformLocation(program, "u_radii"), radiusArray);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);
  }

  function drawLines() {
    const lineVertices = updateLines();

    gl.useProgram(lineProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, lineVertices, gl.DYNAMIC_DRAW);

    const positionAttribLoc = gl.getAttribLocation(lineProgram, "a_position");
    gl.vertexAttribPointer(positionAttribLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionAttribLoc);

    gl.drawArrays(gl.LINES, 0, lineVertices.length / 2);
  }

  function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    updateCircleUniforms();

    gl.useProgram(lineProgram);
    drawLines(points);
  }

  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = 1 - ((e.clientY - rect.top) / rect.height) * 2;

    for (let i = 0; i < points.length; i++) {
      const circle = points[i];

      const dx = (0.5 * x + 0.5) - circle.cx;
      const dy = (0.5 * y + 0.5) - circle.cy;

      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= RADIUS_SIZE) {
        isDragging = i;
        break;
      }
    }
  });

  canvas.addEventListener("mousemove", (e) => {
    if (isDragging !== -1) {
      const rect = canvas.getBoundingClientRect();
      points[isDragging].cx = (e.clientX - rect.left) / rect.width;
      points[isDragging].cy = 1 - (e.clientY - rect.top) / rect.height;

      updatePoints();
      draw();
    }
  });

  canvas.addEventListener("mouseup", () => {
    isDragging = -1;
  });

  canvas.addEventListener("mouseleave", () => {
    isDragging = -1;
  });

  function resizeCanvas() {
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.useProgram(program);

    gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);

    aspectRatio = canvas.width / canvas.height;
  }

  window.addEventListener("resize", () => {
    resizeCanvas();
    draw();
  });

  draw();
}
