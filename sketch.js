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
    if (dist(adjustedMouseX, mouseY, ray.x1, ray.y1) < dragRadius) {
      draggingRayPoint = 0;
    } else if (dist(adjustedMouseX, mouseY, ray.x2, ray.y2) < dragRadius) {
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
    ray.x1 = constrain(adjustedMouseX, minX, maxX);
    ray.y1 = constrain(mouseY, minY, maxY);
  } else if (draggingRayPoint === 1) {
    ray.x2 = constrain(adjustedMouseX, minX, maxX);
    ray.y2 = constrain(mouseY, minY, maxY);
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
  // Left-click in heightmap area to reset to n-1
  const viewHeight = params.canvasHeight - 2 * params.sideViewPadding;
  const viewWidth = params.canvasWidth - params.uiPanelWidth - 2 * params.sideViewPadding;
  const adjustedMouseX = mouseX - params.uiPanelWidth;
  const minX = params.sideViewPadding;
  const maxX = params.sideViewPadding + viewWidth;
  const minY = params.sideViewPadding;
  const maxY = params.sideViewPadding + viewHeight;
  
  // Check if mouse is over heightmap visualization area and not dragging ray
  if (adjustedMouseX >= minX && adjustedMouseX <= maxX && mouseY >= minY && mouseY <= maxY) {
    if (draggingRayPoint === -1) {
      currentIteration = params.rayIterations - 1;
      return false;
    }
  }
}
