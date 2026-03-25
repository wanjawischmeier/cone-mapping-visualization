import { params } from '../../config.js';
import { state } from '../../state.js';
import { clipLineToBox } from './shapes.js';

// ============================================================================
// CONE STEPPING VISUALIZATION
// ============================================================================
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
  if (stepPoints.length > 1 && state.steppingData.currentConeIndex >= 0) {
    const closestIndex = state.steppingData.currentConeIndex;
    const cone = state.coneMap[closestIndex];
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
