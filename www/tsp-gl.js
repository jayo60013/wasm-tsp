// tsp-gl.js
import { updateLines } from "./utils.js";

export function draw(gl, points, program, lineProgram, positionBuffer, lineBuffer, pointOrder, aspectRatio) {
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw Circles
  updateCircleUniforms(gl, points, program, positionBuffer);

  // Draw Lines
  const lineVertices = updateLines(points, pointOrder);
  drawLines(gl, lineProgram, lineBuffer, lineVertices);
}

function updateCircleUniforms(gl, points, program, positionBuffer) {
  const centerArray = new Float32Array(points.length * 2);

  points.forEach((point, i) => {
    centerArray[i * 2] = point.cx;
    centerArray[i * 2 + 1] = point.cy;
  });

  gl.useProgram(program);

  gl.uniform2fv(gl.getUniformLocation(program, "u_centers"), centerArray);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const positionAttribLoc = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionAttribLoc);
  gl.vertexAttribPointer(positionAttribLoc, 2, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);
}

function drawLines(gl, program, buffer, lineVertices) {
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, lineVertices, gl.DYNAMIC_DRAW);

  const positionAttribLoc = gl.getAttribLocation(program, "a_position");
  gl.enableVertexAttribArray(positionAttribLoc);
  gl.vertexAttribPointer(positionAttribLoc, 2, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.LINES, 0, lineVertices.length / 2);
}
