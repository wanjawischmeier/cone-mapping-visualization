// ============================================================================
// UI PANEL
// ============================================================================
let uiPanelX = 10;
let uiPanelY = 10;
let uiPanelWidth = 220;
let currentUIY = uiPanelY + 20;

function createUIPanel() {
  // This is handled in drawUIPanel for dynamic layout
}

function drawUIPanel() {
  fill(220);
  stroke(100);
  strokeWeight(1);
  rect(uiPanelX, uiPanelY, uiPanelWidth, params.canvasHeight - 20);
  
  fill(0);
  textSize(14);
  textAlign(LEFT);
  textStyle(BOLD);
  text("CONTROLS", uiPanelX + 10, uiPanelY + 25);
  textStyle(NORMAL);
  
  currentUIY = uiPanelY + 50;
  
  // Generate Heightmap Button
  if (drawButton("Generate Heightmap", uiPanelX + 10, currentUIY, 200, 30)) {
    generateRandomHeightmap();
  }
  currentUIY += 50;
  
  // Generate Cone Map Button
  if (drawButton("Generate Cone Map", uiPanelX + 10, currentUIY, 200, 30)) {
    generateConeMap();
  }
  currentUIY += 50;
  
  // Toggle Ray visibility
  if (drawCheckbox("Show Ray", uiState.showRay, uiPanelX + 10, currentUIY)) {
    uiState.showRay = !uiState.showRay;
  }
  currentUIY += 30;
  
  // Toggle Ray-Cone Intersections visibility
  if (drawCheckbox("Show Intersections", uiState.showIntersections, uiPanelX + 10, currentUIY)) {
    uiState.showIntersections = !uiState.showIntersections;
  }
  currentUIY += 50;
  
  textSize(11);
  textStyle(BOLD);
  text("Parameters:", uiPanelX + 10, currentUIY);
  currentUIY += 20;
  
  textStyle(NORMAL);
  textSize(10);
  
  // Sliders
  currentUIY = drawSlider("Resolution:", params.heightmapResolution, 10, 100, uiPanelX + 10, currentUIY, 200, (val) => {
    params.heightmapResolution = val;
  });
  
  currentUIY = drawSlider("Height Scale:", params.heightmapScale, 10, 200, uiPanelX + 10, currentUIY, 200, (val) => {
    params.heightmapScale = val;
  });
  
  currentUIY = drawSlider("Point Size:", params.pointSize, 3, 15, uiPanelX + 10, currentUIY, 200, (val) => {
    params.pointSize = val;
  });
  
  currentUIY = drawSlider("Line Weight:", params.lineWeight, 1, 5, uiPanelX + 10, currentUIY, 200, (val) => {
    params.lineWeight = val;
  });
}

function drawButton(label, x, y, w, h) {
  let isHovering = mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
  
  fill(isHovering ? 100 : 150);
  stroke(50);
  strokeWeight(2);
  rect(x, y, w, h);
  
  fill(255);
  textSize(12);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  text(label, x + w / 2, y + h / 2);
  
  return isHovering && mouseIsPressed;
}

function drawCheckbox(label, isChecked, x, y) {
  const boxSize = 16;
  const labelX = x + boxSize + 10;
  
  // Draw checkbox
  fill(isChecked ? 100 : 255);
  stroke(50);
  strokeWeight(1);
  rect(x, y, boxSize, boxSize);
  
  // Draw checkmark if checked
  if (isChecked) {
    stroke(255);
    strokeWeight(2);
    noFill();
    line(x + 4, y + 8, x + 7, y + 11);
    line(x + 7, y + 11, x + 12, y + 6);
  }
  
  // Draw label
  fill(0);
  textSize(11);
  textAlign(LEFT, CENTER);
  textStyle(NORMAL);
  text(label, labelX, y + boxSize / 2);
  
  // Check for click
  let isHovering = mouseX > x && mouseX < x + boxSize && mouseY > y && mouseY < y + boxSize;
  return isHovering && mouseIsPressed;
}

function drawSlider(label, value, min, max, x, y, w, callback) {
  // Label
  fill(0);
  textSize(10);
  textAlign(LEFT);
  text(label, x, y);
  
  // Slider background
  let sliderY = y + 15;
  fill(200);
  stroke(100);
  strokeWeight(1);
  rect(x, sliderY, w, 8);
  
  // Slider thumb
  let thumbX = map(value, min, max, x, x + w);
  
  // Check for interaction
  if (mouseIsPressed && mouseX > x && mouseX < x + w && mouseY > sliderY - 10 && mouseY < sliderY + 18) {
    const newVal = map(mouseX, x, x + w, min, max);
    callback(constrain(newVal, min, max));
  }
  
  fill(100);
  circle(thumbX, sliderY + 4, 12);
  
  // Value display
  fill(0);
  textSize(9);
  textAlign(RIGHT);
  text(value.toFixed(1), x + w, y);
  
  return y + 40;
}
