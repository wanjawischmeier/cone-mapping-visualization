import { params } from '../config.js';
import { coneMap, state } from '../state.js';
import { generateRandomHeightmap } from '../heightmap.js';
import { generateConeMap } from '../coneMap.js';
import { drawButton } from './components/button.js';

// Helper: Detect if mouse clicked (transition from not pressed to pressed)
function isMouseClicked(x, y, w, h) {
  const isHovering = mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
  const wasPressed = state.prevMousePressed;
  const isPressed = mouseIsPressed;
  return isHovering && isPressed && !wasPressed;
}

export function createUIPanel() {
  // This is handled in drawUIPanel for dynamic layout
}

export function drawUIPanel() {
  const uiPanelX = 0;
  const uiPanelY = 0;
  let currentUIY = 25;
  
  fill(220);
  stroke(100);
  strokeWeight(1);
  rect(uiPanelX, uiPanelY, params.uiPanelWidth, params.canvasHeight);
  
  fill(0);
  noStroke();
  textSize(14);
  textAlign(LEFT);
  textStyle(BOLD);
  text("CONTROLS", uiPanelX + 10, uiPanelY + 15);
  textStyle(NORMAL);
  
  currentUIY = 50;
  
  // Generate Heightmap Button
  if (isMouseClicked(uiPanelX + 10, currentUIY, params.uiPanelWidth - 20, 30)) {
    generateRandomHeightmap();
  }
  drawButton("Generate Heightmap", uiPanelX + 10, currentUIY, params.uiPanelWidth - 20, 30);
  currentUIY += 50;
  
  // Generate Cone Map Button
  const coneMapExists = coneMap.length > 0;
  if (isMouseClicked(uiPanelX + 10, currentUIY, params.uiPanelWidth - 20, 30) && !coneMapExists) {
    generateConeMap();
  }
  drawButton("Generate Cone Map", uiPanelX + 10, currentUIY, params.uiPanelWidth - 20, 30, coneMapExists);
  
  // Cone map status indicator
  let coneMapStatus = coneMap.length > 0 ? "✓ Ready" : "✗ Not Generated";
  let statusColor = coneMap.length > 0 ? [0, 150, 0] : [150, 0, 0];
  fill(...statusColor);
  noStroke();
  textSize(10);
  textAlign(RIGHT);
  text(coneMapStatus, uiPanelX + params.uiPanelWidth - 10, currentUIY + 40);
  textAlign(LEFT);
  
  currentUIY += 50;
  
  // Cone mode selector
  fill(0);
  noStroke();
  textSize(10);
  textAlign(LEFT);
  text("Cone Mode:", uiPanelX + 10, currentUIY);
  currentUIY += 15;
  
  const modeButtonWidth = (params.uiPanelWidth - 30) / 2;
  const isIsotropic = params.coneMode === 'isotropic';
  
  // Isotropic button
  fill(isIsotropic ? 100 : 150);
  stroke(50);
  strokeWeight(1);
  rect(uiPanelX + 10, currentUIY, modeButtonWidth, 20);
  fill(255);
  noStroke();
  textSize(9);
  textAlign(CENTER, CENTER);
  text("Isotropic", uiPanelX + 10 + modeButtonWidth / 2, currentUIY + 10);
  
  if (isMouseClicked(uiPanelX + 10, currentUIY, modeButtonWidth, 20)) {
    params.coneMode = 'isotropic';
    state.coneMap.length = 0;
  }
  
  // Anisotropic button
  fill(!isIsotropic ? 100 : 150);
  stroke(50);
  strokeWeight(1);
  rect(uiPanelX + 20 + modeButtonWidth, currentUIY, modeButtonWidth, 20);
  fill(255);
  noStroke();
  textSize(9);
  textAlign(CENTER, CENTER);
  text("Anisotropic", uiPanelX + 20 + modeButtonWidth + modeButtonWidth / 2, currentUIY + 10);
  
  if (isMouseClicked(uiPanelX + 20 + modeButtonWidth, currentUIY, modeButtonWidth, 20)) {
    params.coneMode = 'anisotropic';
    state.coneMap.length = 0;
  }
  
  currentUIY += 40;
  
  // Toggle Ray visibility
  if (drawCheckbox("Show Ray", state.uiState.showRay, uiPanelX + 10, currentUIY)) {
    state.uiState.toggleRay();
  }
  currentUIY += 30;
  
  // Toggle Cone Stepping visibility (disabled if Show Ray is off or no cone map)
  const coneSteppingDisabled = !state.uiState.showRay || coneMap.length === 0;
  if (drawCheckbox("Show Cone Stepping", state.uiState.showConeStepping, uiPanelX + 10, currentUIY, coneSteppingDisabled)) {
    state.uiState.toggleConeStepping();
  }
  currentUIY += 30;
  
  // Toggle Hovered Cone visibility (disabled if no cone map)
  const hoveredConeDisabled = coneMap.length === 0;
  if (drawCheckbox("Show Hovered Cone", state.uiState.showHoveredCone, uiPanelX + 10, currentUIY, hoveredConeDisabled)) {
    state.uiState.toggleHoveredCone();
  }
  currentUIY += 50;
  
  fill(0);
  noStroke();
  textSize(11);
  textStyle(BOLD);
  text("Parameters:", uiPanelX + 10, currentUIY);
  textStyle(NORMAL);
  currentUIY += 20;
  
  textSize(10);
  
  // Sliders
  const sliderWidth = params.uiPanelWidth - 20;
  currentUIY = drawSlider("Resolution:", params.heightmapResolution, 10, 100, uiPanelX + 10, currentUIY, sliderWidth, (val) => {
    params.heightmapResolution = Math.floor(val);
    state.heightmap.length = 0;
    state.coneMap.length = 0;
  });
  
  currentUIY = drawSlider("Height Scale:", params.heightmapScale, 10, 200, uiPanelX + 10, currentUIY, sliderWidth, (val) => {
    params.heightmapScale = val;
  });
  
  currentUIY = drawSlider("Point Size:", params.pointSize, 3, 15, uiPanelX + 10, currentUIY, sliderWidth, (val) => {
    params.pointSize = val;
  });
  
  currentUIY = drawSlider("Line Weight:", params.lineWeight, 1, 5, uiPanelX + 10, currentUIY, sliderWidth, (val) => {
    params.lineWeight = val;
  });
  
  currentUIY = drawSlider("Max Iterations (n):", params.rayIterations, 1, 50, uiPanelX + 10, currentUIY, sliderWidth, (val) => {
    const previousMax = params.rayIterations;
    params.rayIterations = Math.floor(val);
    
    // If slider was at maximum, jump it to the new maximum
    if (state.currentIteration === previousMax - 1) {
      state.currentIteration = params.rayIterations - 1;
    } else if (state.currentIteration > params.rayIterations - 1) {
      // If it exceeds the new max, clamp it
      state.currentIteration = params.rayIterations - 1;
    }
  });
  
  currentUIY = drawSlider("Slope Start:", params.heightmapSlopeStart, -1, 1, uiPanelX + 10, currentUIY, sliderWidth, (val) => {
    params.heightmapSlopeStart = val;
  });
  
  currentUIY = drawSlider("Slope End:", params.heightmapSlopeEnd, -1, 1, uiPanelX + 10, currentUIY, sliderWidth, (val) => {
    params.heightmapSlopeEnd = val;
  });
  
  currentUIY = drawSlider("Noise Power:", params.heightmapNoisePower, 0, 1, uiPanelX + 10, currentUIY, sliderWidth, (val) => {
    params.heightmapNoisePower = val;
  });
}



function drawCheckbox(label, isChecked, x, y, disabled = false) {
  const boxSize = 16;
  const labelX = x + boxSize + 10;
  
  // Draw checkbox
  if (disabled) {
    fill(200);
    stroke(150);
  } else {
    fill(isChecked ? 100 : 255);
    stroke(50);
  }
  strokeWeight(1);
  rect(x, y, boxSize, boxSize);
  
  // Draw checkmark if checked
  if (isChecked && !disabled) {
    stroke(255);
    strokeWeight(2);
    noFill();
    line(x + 4, y + 8, x + 7, y + 11);
    line(x + 7, y + 11, x + 12, y + 6);
  }
  
  // Draw label
  fill(disabled ? 150 : 0);
  noStroke();
  textSize(11);
  textAlign(LEFT, CENTER);
  textStyle(NORMAL);
  text(label, labelX, y + boxSize / 2);
  
  // Check for click (only if not disabled)
  return !disabled && isMouseClicked(x, y, boxSize, boxSize);
}

function drawSlider(label, value, min, max, x, y, w, callback) {
  // Label
  fill(0);
  noStroke();
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
  noStroke();
  circle(thumbX, sliderY + 4, 12);
  
  // Value display
  fill(0);
  noStroke();
  textSize(9);
  textAlign(RIGHT);
  text(value.toFixed(1), x + w, y);
  
  return y + 40;
}
