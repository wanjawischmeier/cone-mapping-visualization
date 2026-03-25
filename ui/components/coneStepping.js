import { params } from '../../config.js';
import { state } from '../../state.js';
import { clipLineToBox } from './shapes.js';

export function drawConeStepping(viewWidth, viewHeight) {
  if (!state.steppingData || !state.steppingData.stepPoints.length) return;

  const viewHeight_canvas = params.canvasHeight - 2 * params.sideViewPadding;
  const scaleFactor = params.heightmapScale / 100;
  const pointSpacing = state.steppingData.pointSpacing;
  
  const boxMinX = params.sideViewPadding;
  const boxMinY = params.sideViewPadding;
  const boxMaxX = params.sideViewPadding + viewWidth;
  const boxMaxY = params.sideViewPadding + viewHeight_canvas;

  const stepPoints = state.steppingData.stepPoints;

  // Draw all step points up to current iteration
  for (let i = 0; i < stepPoints.length; i++) {
    const pt = stepPoints[i];
    const isCurrent = i === stepPoints.length - 1;
    const stepColor = isCurrent ? [200, 100, 200] : [150, 150, 255];
    fill(...stepColor);
    noStroke();
    circle(pt.x, pt.y, 8);
  }

  // For current iteration, draw its cone in purple
  if (stepPoints.length > 1 && state.steppingData.currentConeIndex >= 0 && state.steppingData.currentConeIndex < state.coneMap.length) {
    const closestIndex = state.steppingData.currentConeIndex;
    const cone = state.coneMap[closestIndex];
    if (!cone || closestIndex >= state.heightmap.length) return; // Safety check
    
    const coneX = params.sideViewPadding + closestIndex * pointSpacing;
    const coneHeightY = params.sideViewPadding + viewHeight_canvas - state.heightmap[closestIndex] * scaleFactor * viewHeight_canvas;

    const effectiveViewHeight = viewHeight_canvas * scaleFactor;
    const leftSlopePixels = Math.tan(cone.leftAngle) * (effectiveViewHeight / pointSpacing);
    const rightSlopePixels = Math.tan(cone.rightAngle) * (effectiveViewHeight / pointSpacing);

    // Draw left cone edge in purple
    const leftEdge = clipLineToBox(coneX, coneHeightY, -1, -leftSlopePixels, boxMinX, boxMinY, boxMaxX, boxMaxY);
    if (leftEdge) {
      stroke(200, 100, 200);
      strokeWeight(2);
      line(leftEdge.startX, leftEdge.startY, leftEdge.endX, leftEdge.endY);
    }

    // Draw right cone edge in purple
    const rightEdge = clipLineToBox(coneX, coneHeightY, 1, -rightSlopePixels, boxMinX, boxMinY, boxMaxX, boxMaxY);
    if (rightEdge) {
      stroke(200, 100, 200);
      strokeWeight(2);
      line(rightEdge.startX, rightEdge.startY, rightEdge.endX, rightEdge.endY);
    }

    // Apex point
    fill(200, 100, 200);
    noStroke();
    circle(coneX, coneHeightY, 6);
  }
}

// Draw the last stepped state with low opacity (shown when paused)
export function drawLastSteppingState(viewWidth, viewHeight) {
  // Only show when stepping is paused
  if (state.steppingRunning || !state.lastSteppingData || !state.lastSteppingData.stepPoints.length) return;

  const viewHeight_canvas = params.canvasHeight - 2 * params.sideViewPadding;
  const scaleFactor = params.heightmapScale / 100;
  const pointSpacing = state.lastSteppingData.pointSpacing;
  const opacity = 100; // Out of 255
  
  const boxMinX = params.sideViewPadding;
  const boxMinY = params.sideViewPadding;
  const boxMaxX = params.sideViewPadding + viewWidth;
  const boxMaxY = params.sideViewPadding + viewHeight_canvas;

  const stepPoints = state.lastSteppingData.stepPoints;

  // Draw all step points with low opacity
  for (let i = 0; i < stepPoints.length; i++) {
    const pt = stepPoints[i];
    const isCurrent = i === stepPoints.length - 1;
    const stepColor = isCurrent ? [200, 100, 200] : [150, 150, 255];
    fill(...stepColor, opacity);
    noStroke();
    circle(pt.x, pt.y, 8);
  }

  // Draw the cone at the last position with low opacity
  if (stepPoints.length > 1 && state.lastSteppingData.currentConeIndex >= 0 && state.lastSteppingData.currentConeIndex < state.coneMap.length) {
    const closestIndex = state.lastSteppingData.currentConeIndex;
    const cone = state.coneMap[closestIndex];
    if (!cone || closestIndex >= state.heightmap.length) return; // Safety check
    
    const coneX = params.sideViewPadding + closestIndex * pointSpacing;
    const coneHeightY = params.sideViewPadding + viewHeight_canvas - state.heightmap[closestIndex] * scaleFactor * viewHeight_canvas;

    const effectiveViewHeight = viewHeight_canvas * scaleFactor;
    const leftSlopePixels = Math.tan(cone.leftAngle) * (effectiveViewHeight / pointSpacing);
    const rightSlopePixels = Math.tan(cone.rightAngle) * (effectiveViewHeight / pointSpacing);

    // Draw left cone edge with low opacity
    const leftEdge = clipLineToBox(coneX, coneHeightY, -1, -leftSlopePixels, boxMinX, boxMinY, boxMaxX, boxMaxY);
    if (leftEdge) {
      stroke(200, 100, 200, opacity);
      strokeWeight(2);
      line(leftEdge.startX, leftEdge.startY, leftEdge.endX, leftEdge.endY);
    }

    // Draw right cone edge with low opacity
    const rightEdge = clipLineToBox(coneX, coneHeightY, 1, -rightSlopePixels, boxMinX, boxMinY, boxMaxX, boxMaxY);
    if (rightEdge) {
      stroke(200, 100, 200, opacity);
      strokeWeight(2);
      line(rightEdge.startX, rightEdge.startY, rightEdge.endX, rightEdge.endY);
    }

    // Apex point
    fill(200, 100, 200, opacity);
    noStroke();
    circle(coneX, coneHeightY, 6);
  }

  // Draw the old ray with low opacity
  if (state.lastRay) {
    const rayDx = state.lastRay.x2 - state.lastRay.x1;
    const rayDy = state.lastRay.y2 - state.lastRay.y1;

    // Clip ray to box
    const clipped = clipLineToBox(state.lastRay.x1, state.lastRay.y1, rayDx, rayDy, boxMinX, boxMinY, boxMaxX, boxMaxY);
    if (clipped) {
      stroke(100, 150, 255, opacity);
      strokeWeight(2);
      line(clipped.startX, clipped.startY, clipped.endX, clipped.endY);
    }
  }
}
