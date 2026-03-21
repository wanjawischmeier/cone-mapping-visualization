// ============================================================================
// STATE
// ============================================================================
let heightmap = undefined;
let coneMap = undefined;
let hoveredIndex = -1;
let ray = {
  x1: 150,
  y1: 100,
  x2: 300,
  y2: 400
};
let draggingRayPoint = -1; // -1 = not dragging, 0 = point1, 1 = point2
let rayIntersections = []; // Array of intersection objects
let uiState = {
  showRay: true,
  showIntersections: true
};
