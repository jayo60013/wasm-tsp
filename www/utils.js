// utils.js
export function initPoints(points) {
  let cs = [];
  for (let i = 0; i < points.length; i += 2) {
    cs.push(new Point(points[i], points[i + 1]));
  }
  return cs;
}

export function updateLines(points, pointOrder) {
  const lineVertices = [];
  for (let i = 0; i < pointOrder.length - 1; i++) {
    const j = pointOrder[i];
    const k = pointOrder[i + 1];
    lineVertices.push(points[j].cx * 2 - 1, points[j].cy * 2 - 1);
    lineVertices.push(points[k].cx * 2 - 1, points[k].cy * 2 - 1);
  }
  return new Float32Array(lineVertices);
}
