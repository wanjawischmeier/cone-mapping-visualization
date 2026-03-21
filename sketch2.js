// ============================================================================
// SETUP & DRAW
// ============================================================================
function setup() {
  createCanvas(params.canvasWidth, params.canvasHeight);
  createUIPanel();
}

function draw() {
  background(240);
  
  // Draw main visualization area
  push();
  translate(250, 0);
  drawHeightmapVisualization();
  pop();
  
  // Draw parameter sliders on the left
  drawUIPanel();
}

function mouseDragged() {
  // Check if dragging a ray point (accounting for the 250px translate)
  const adjustedMouseX = mouseX - 250;
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
  const viewWidth = params.canvasWidth - 2 * params.sideViewPadding - 250;
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
