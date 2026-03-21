// ============================================================================
// STATE
// ============================================================================
let heightmap = undefined;
let coneMap = undefined;
let hoveredIndex = -1;
let ray = {
  x1: 916,
  y1: 96,
  x2: 787,
  y2: 159
};
let draggingRayPoint = -1; // -1 = not dragging, 0 = point1, 1 = point2
let rayIntersections = []; // Array of intersection objects
let uiState = {
  showRay: true,
  showIntersections: true,
  showHoveredCone: false
};
let prevMousePressed = false; // Track previous frame's mouse state for click detection
let currentIteration = 0; // To be synced with params.rayIterations (0 = origin)
