// ============================================================================
// UI STATE CLASS
// ============================================================================
class UIState {
  constructor() {
    this.showRay = true;
    this.showConeStepping = true;
    this.showHoveredCone = false;
  }

  // Toggle ray visibility
  toggleRay() {
    this.showRay = !this.showRay;
  }

  // Toggle cone stepping visibility
  toggleConeStepping() {
    this.showConeStepping = !this.showConeStepping;
  }

  // Toggle hovered cone visibility
  toggleHoveredCone() {
    this.showHoveredCone = !this.showHoveredCone;
  }

  // Reset to defaults
  reset() {
    this.showRay = true;
    this.showConeStepping = true;
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
let currentIteration = 9; // Start at maximum (params.rayIterations - 1, with default rayIterations = 10)
let draggingIterationSlider = false; // Track if currently dragging iteration slider
