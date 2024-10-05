export function setupCanvas(gl, canvas) {
  canvas.width = canvas.clientWidth * window.devicePixelRatio;
  canvas.height = canvas.clientHeight * window.devicePixelRatio;
  gl.viewport(0, 0, canvas.width, canvas.height);

  return {
    canvas,
    gl,
    aspectRatio: canvas.width / canvas.height
  };
}

export function setupEventListeners(canvas, points, isDragging, onMouseMove, radiusSize) {
  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = 1 - ((e.clientY - rect.top) / rect.height) * 2;

    for (let i = 0; i < points.length; i++) {
      const circle = points[i];

      const dx = (0.5 * x + 0.5) - circle.cx;
      const dy = (0.5 * y + 0.5) - circle.cy;

      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= radiusSize) {
        isDragging.current = i;
        break;
      }
    }
  })

  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mouseup", () => {
    isDragging.current = -1;
  });
  canvas.addEventListener("mouseleave", () => {
    isDragging.current = -1;
  });
}

export function resizeCanvas(gl, canvas, program, aspectRatio) {
  canvas.width = canvas.clientWidth * window.devicePixelRatio;
  canvas.height = canvas.clientHeight * window.devicePixelRatio;
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.useProgram(program);
  gl.uniform2f(gl.getUniformLocation(program, "u_resolution"), canvas.width, canvas.height);
  aspectRatio = canvas.width / canvas.height;
}
