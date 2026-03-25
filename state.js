// ============================================================================
// UI STATE CLASS
// ============================================================================
class UIState {
  constructor() {
    this.showRay = true;
    this.showIntersections = true;
    this.showHoveredCone = false;
  }

  // Toggle ray visibility
  toggleRay() {
    this.showRay = !this.showRay;
  }

  // Toggle intersections visibility
  toggleIntersections() {
    this.showIntersections = !this.showIntersections;
  }

  // Toggle hovered cone visibility
  toggleHoveredCone() {
    this.showHoveredCone = !this.showHoveredCone;
  }

  // Reset to defaults
  reset() {
    this.showRay = true;
    this.showIntersections = true;
    this.showHoveredCone = false;
  }
}

// ============================================================================
// STATE
// ============================================================================
let heightmap = undefined;
let coneMap = undefined;
let hoveredIndex = -1;
let ray = new Ray(150, 100, 300, 400);
let draggingRayPoint = -1; // -1 = not dragging, 0 = point1, 1 = point2
let rayIntersections = []; // Array of intersection objects
let uiState = new UIState();
let prevMousePressed = false; // Track previous frame's mouse state for click detection
let currentIteration = 0; // To be synced with params.rayIterations (0 = origin)
