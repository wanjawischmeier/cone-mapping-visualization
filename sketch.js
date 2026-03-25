// ============================================================================
// SETUP & DRAW
// ============================================================================
function setup() {
  createCanvas(params.canvasWidth, params.canvasHeight);
  createUIPanel();
  
  // Generate initial heightmap
  generateRandomHeightmap();
}

function draw() {
  background(240);
  
  // Draw main visualization area
  push();
  translate(params.uiPanelWidth, 0);
  drawHeightmapVisualization();
  pop();
  
  // Draw parameter sliders on the left
  drawUIPanel();
  
  // Update previous frame's mouse state for click detection
  prevMousePressed = mouseIsPressed;
}

function windowResized() {
  resizeCanvas(params.canvasWidth, params.canvasHeight);
}

function mouseDragged() {
  // Check if dragging a ray point (accounting for the UI panel offset)
  const adjustedMouseX = mouseX - params.uiPanelWidth;
  const dragRadius = 16;
  
  // Check if we should start dragging
  if (draggingRayPoint === -1) {
    const nearPoints = ray.isNearPoint(adjustedMouseX, mouseY, dragRadius);
    if (nearPoints.point1) {
      draggingRayPoint = 0;
    } else if (nearPoints.point2) {
      draggingRayPoint = 1;
    }
  }
  
  // Calculate visualization bounds
  const viewHeight = params.canvasHeight - 2 * params.sideViewPadding;
  const viewWidth = params.canvasWidth - params.uiPanelWidth - 2 * params.sideViewPadding;
  const minX = params.sideViewPadding;
  const maxX = params.sideViewPadding + viewWidth;
  const minY = params.sideViewPadding;
  const maxY = params.sideViewPadding + viewHeight;
  
  // Update ray point if dragging, with bounds checking
  if (draggingRayPoint === 0) {
    ray.setPoint1(constrain(adjustedMouseX, minX, maxX), constrain(mouseY, minY, maxY));
  } else if (draggingRayPoint === 1) {
    ray.setPoint2(constrain(adjustedMouseX, minX, maxX), constrain(mouseY, minY, maxY));
  }
}

function mouseReleased() {
  draggingRayPoint = -1;
}

function mouseWheel(event) {
  // Mouse wheel to change iteration
  const viewHeight = params.canvasHeight - 2 * params.sideViewPadding;
  const viewWidth = params.canvasWidth - params.uiPanelWidth - 2 * params.sideViewPadding;
  const adjustedMouseX = mouseX - params.uiPanelWidth;
  const minX = params.sideViewPadding;
  const maxX = params.sideViewPadding + viewWidth;
  const minY = params.sideViewPadding;
  const maxY = params.sideViewPadding + viewHeight;
  
  // Check if mouse is over heightmap visualization area
  if (adjustedMouseX >= minX && adjustedMouseX <= maxX && mouseY >= minY && mouseY <= maxY) {
    if (event.delta > 0) {
      currentIteration = Math.max(0, currentIteration - 1);
    } else {
      currentIteration = Math.min(params.rayIterations - 1, currentIteration + 1);
    }
    event.preventDefault();
    return false;
  }
}

function mousePressed() {
  // Only reset iteration if specifically not dragging the slider or ray
  // Do not automatically reset on general clicks
  return false;
}
