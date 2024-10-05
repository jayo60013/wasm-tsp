// shaders.js
export function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

export function createShaderProgram(gl, vertexCode, fragCode) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexCode);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragCode);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  return program;
}

