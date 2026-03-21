// ============================================================================
// VISUALIZATION
// ============================================================================
function drawHeightmapVisualization() {
  if (heightmap === undefined) {
    fill(150);
    textAlign(CENTER, CENTER);
    text("Generate a heightmap to start", params.canvasWidth / 2 - params.uiPanelWidth, params.canvasHeight / 2);
    return;
  }

  const viewHeight = params.canvasHeight - 2 * params.sideViewPadding;
  const viewWidth = params.canvasWidth - params.uiPanelWidth - 2 * params.sideViewPadding;
  const pointSpacing = viewWidth / (heightmap.length - 1);

  // Draw background for visualization area
  fill(255);
  stroke(200);
  strokeWeight(1);
  rect(params.sideViewPadding, params.sideViewPadding, viewWidth, viewHeight);

  // Draw iteration slider at top
  drawIterationSlider(pointSpacing, viewWidth);

  // Draw heightmap profile (side view)
  drawHeightmapProfile(pointSpacing, viewHeight);

  // Draw height field points at bottom with color corresponding to height
  drawHeightFieldPoints(pointSpacing, viewHeight);

  // Update hovered index based on closest x-wise point in entire visualization
  updateHoveredIndexFromMouse(pointSpacing, viewHeight, viewWidth);

  // Draw ray if enabled
  if (uiState.showRay) {
    drawRay(params.sideViewPadding, params.sideViewPadding, viewWidth, viewHeight);
    // Draw ray stepping visualization
    drawRayStepping(pointSpacing, viewHeight, viewWidth);
  }

  // Draw cone visualization and intersections if hovering
  if (coneMap !== undefined && hoveredIndex >= 0) {
    rayIntersections = rayConeConeIntersection(ray.x1, ray.y1, ray.x2, ray.y2,
      params.sideViewPadding + hoveredIndex * pointSpacing,
      params.sideViewPadding + viewHeight - heightmap[hoveredIndex] * (params.heightmapScale / 100) * viewHeight,
      coneMap[hoveredIndex].angle,
      pointSpacing,
      viewHeight);

    drawHoveredCone(pointSpacing, viewHeight, viewWidth);

    // Draw ray-cone intersections if enabled
    if (uiState.showIntersections) {
      drawRayIntersections();
    }
  }
}

function updateHoveredIndexFromMouse(pointSpacing, viewHeight, viewWidth) {
  // Account for the UI panel offset (already translated, so relative to visualization area)
  const adjustedMouseX = mouseX - params.uiPanelWidth;
  
  // Find closest point x-wise within the visualization area
  const minX = params.sideViewPadding;
  const maxX = params.sideViewPadding + viewWidth;
  
  hoveredIndex = -1;
  let closestDist = Infinity;
  
  for (let i = 0; i < heightmap.length; i++) {
    const ptX = params.sideViewPadding + i * pointSpacing;
    const dist = Math.abs(adjustedMouseX - ptX);
    
    if (dist < closestDist && adjustedMouseX >= minX && adjustedMouseX <= maxX) {
      closestDist = dist;
      hoveredIndex = i;
    }
  }
}

function drawHeightmapProfile(pointSpacing, viewHeight) {
  stroke(0);
  strokeWeight(params.lineWeight);
  noFill();
  
  beginShape();
  for (let i = 0; i < heightmap.length; i++) {
    const x = params.sideViewPadding + i * pointSpacing;
    const y = params.sideViewPadding + viewHeight - heightmap[i] * (params.heightmapScale / 100) * viewHeight;
    vertex(x, y);
  }
  endShape();
  
  // Draw profile points
  fill(0);
  noStroke();
  for (let i = 0; i < heightmap.length; i++) {
    const x = params.sideViewPadding + i * pointSpacing;
    const y = params.sideViewPadding + viewHeight - heightmap[i] * (params.heightmapScale / 100) * viewHeight;
    circle(x, y, params.pointSize);
  }
}

function drawHeightFieldPoints(pointSpacing, viewHeight) {
  const baseY = params.sideViewPadding + viewHeight + 40;

  for (let i = 0; i < heightmap.length; i++) {
    const x = params.sideViewPadding + i * pointSpacing;

    // Color based on scaled height (grayscale)
    const scaledHeight = heightmap[i] * (params.heightmapScale / 100);
    const colorValue = Math.min(scaledHeight, 1) * 255;
    fill(colorValue);
    stroke(0);
    strokeWeight(1);

    circle(x, baseY, params.pointSize);
  }
}

function drawHoveredCone(pointSpacing, viewHeight, viewWidth) {
  if (hoveredIndex < 0 || hoveredIndex >= coneMap.length) return;
  
  const cone = coneMap[hoveredIndex];
  const x = params.sideViewPadding + hoveredIndex * pointSpacing;
  
  // Cone origin at the actual profile point
  const scaledHeight = heightmap[hoveredIndex] * (params.heightmapScale / 100);
  const coneOriginY = params.sideViewPadding + viewHeight - scaledHeight * viewHeight;
  
  // Calculate cone visualization in pixels
  const coneAngle = cone.angle;
  
  // Account for the height scale when computing pixel slopes
  const scaleFactor = params.heightmapScale / 100;
  const effectiveViewHeight = viewHeight * scaleFactor;
  
  // Cone expands at rate: tan(angle) in data space
  const slopePixels = Math.tan(coneAngle) * (effectiveViewHeight / pointSpacing);
  
  // Visualization box bounds
  const boxMinX = params.sideViewPadding;
  const boxMinY = params.sideViewPadding;
  const boxMaxX = params.sideViewPadding + viewWidth;
  const boxMaxY = params.sideViewPadding + viewHeight;
  
  // Left cone edge: passes through apex with direction (-1, -slopePixels)
  const leftEdge = clipLineToBox(x, coneOriginY, -1, -slopePixels, boxMinX, boxMinY, boxMaxX, boxMaxY);
  if (leftEdge) {
    stroke(255, 100, 100);
    strokeWeight(2);
    line(leftEdge.startX, leftEdge.startY, leftEdge.endX, leftEdge.endY);
  }
  
  // Right cone edge: passes through apex with direction (1, -slopePixels)
  const rightEdge = clipLineToBox(x, coneOriginY, 1, -slopePixels, boxMinX, boxMinY, boxMaxX, boxMaxY);
  if (rightEdge) {
    stroke(255, 100, 100);
    strokeWeight(2);
    line(rightEdge.startX, rightEdge.startY, rightEdge.endX, rightEdge.endY);
  }
  
  // Highlight the apex point
  fill(255, 100, 100);
  noStroke();
  circle(x, coneOriginY, params.pointSize + 4);
}

function drawRay(boxMinX, boxMinY, boxWidth, boxHeight) {
  // Visualization box bounds
  const boxMaxX = boxMinX + boxWidth;
  const boxMaxY = boxMinY + boxHeight;

  // Calculate ray direction
  const rayDx = ray.x2 - ray.x1;
  const rayDy = ray.y2 - ray.y1;
  
  // Clip ray to box
  const clipped = clipLineToBox(ray.x1, ray.y1, rayDx, rayDy, boxMinX, boxMinY, boxMaxX, boxMaxY);
  if (clipped) {
    stroke(100, 150, 255);
    strokeWeight(2);
    line(clipped.startX, clipped.startY, clipped.endX, clipped.endY);
  }

  // Draw grabbable endpoints (larger)
  fill(100, 150, 255);
  noStroke();
  circle(ray.x1, ray.y1, 16);
  circle(ray.x2, ray.y2, 16);
}

function drawRayIntersections() {
  if (rayIntersections.length === 0) return;
  
  fill(0, 255, 0);
  noStroke();
  
  for (let intersection of rayIntersections) {
    circle(intersection.x, intersection.y, 10);
  }
}

// Helper: Clip a line defined by point and direction to a box
// Only extends in the positive direction (t >= 0)
// Returns {startX, startY, endX, endY} or null if line misses box
function clipLineToBox(x0, y0, dx, dy, boxMinX, boxMinY, boxMaxX, boxMaxY) {
  const boxMaxX_val = boxMaxX;
  const boxMaxY_val = boxMaxY;
  
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return null;
  
  const ux = dx / len;
  const uy = dy / len;
  
  let minT = 0;  // Only extend forward
  let maxT = Infinity;
  
  // Clip to x bounds
  if (Math.abs(ux) > 1e-6) {
    let tLeft = (boxMinX - x0) / ux;
    let tRight = (boxMaxX_val - x0) / ux;
    let tMin = Math.min(tLeft, tRight);
    let tMax = Math.max(tLeft, tRight);
    minT = Math.max(minT, tMin);
    maxT = Math.min(maxT, tMax);
  } else {
    if (x0 < boxMinX || x0 > boxMaxX_val) return null;
  }
  
  // Clip to y bounds
  if (Math.abs(uy) > 1e-6) {
    let tTop = (boxMinY - y0) / uy;
    let tBottom = (boxMaxY_val - y0) / uy;
    let tMin = Math.min(tTop, tBottom);
    let tMax = Math.max(tTop, tBottom);
    minT = Math.max(minT, tMin);
    maxT = Math.min(maxT, tMax);
  } else {
    if (y0 < boxMinY || y0 > boxMaxY_val) return null;
  }
  
  if (minT < maxT) {
    return {
      startX: x0 + minT * ux,
      startY: y0 + minT * uy,
      endX: x0 + maxT * ux,
      endY: y0 + maxT * uy
    };
  }
  return null;
}

function drawIterationSlider(pointSpacing, viewWidth) {
  const sliderY = 10;
  const sliderWidth = 200;
  const sliderX = (viewWidth - sliderWidth) / 2;
  
  // Draw slider background
  fill(220);
  stroke(100);
  strokeWeight(1);
  rect(sliderX, sliderY, sliderWidth, 20);
  
  // Draw slider thumb
  const thumbX = map(currentIteration, 0, params.rayIterations - 1, sliderX, sliderX + sliderWidth);
  fill(100);
  noStroke();
  rect(thumbX - 5, sliderY, 10, 20);
  
  // Draw label and value
  fill(0);
  noStroke();
  textSize(12);
  textAlign(CENTER, CENTER);
  text(currentIteration + " / " + (params.rayIterations - 1), sliderX + sliderWidth / 2, sliderY + 10);
}

function drawRayStepping(pointSpacing, viewHeight, viewWidth) {
  if (heightmap === undefined || coneMap === undefined) return;
  
  const viewHeight_canvas = params.canvasHeight - 2 * params.sideViewPadding;
  const scaleFactor = params.heightmapScale / 100;
  const boxMinX = params.sideViewPadding;
  const boxMinY = params.sideViewPadding;
  const boxMaxX = params.sideViewPadding + viewWidth;
  const boxMaxY = params.sideViewPadding + viewHeight_canvas;
  
  // Perform actual cone stepping
  let currentX = ray.x1;
  let currentY = ray.y1;
  const stepPoints = [{x: currentX, y: currentY}]; // Include starting point
  
  for (let step = 0; step < currentIteration; step++) {
    // Find closest heightmap point
    let closestIndex = 0;
    let closestDist = Infinity;
    for (let i = 0; i < heightmap.length; i++) {
      const ptX = params.sideViewPadding + i * pointSpacing;
      const dist = Math.abs(currentX - ptX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    }
    
    // Get cone at this point
    const cone = coneMap[closestIndex];
    const coneX = params.sideViewPadding + closestIndex * pointSpacing;
    const coneHeightY = params.sideViewPadding + viewHeight_canvas - heightmap[closestIndex] * scaleFactor * viewHeight_canvas;
    
    // Calculate ray-cone intersection
    // Using a very distant point for ray2 to ensure it acts as an infinite ray
    const rayDx = ray.x2 - ray.x1;
    const rayDy = ray.y2 - ray.y1;
    const rayLen = Math.sqrt(rayDx * rayDx + rayDy * rayDy);
    const rayUx = rayLen > 0 ? rayDx / rayLen : 0;
    const rayUy = rayLen > 0 ? rayDy / rayLen : 0;
    
    // Create an artificial end point far away along the ray direction
    const infiniteRayX2 = currentX + rayUx * 10000;
    const infiniteRayY2 = currentY + rayUy * 10000;

    const intersections = rayConeConeIntersection(
      currentX, currentY,
      infiniteRayX2, infiniteRayY2,
      coneX, coneHeightY,
      cone.angle,
      pointSpacing,
      viewHeight_canvas
    );
    
    // Find the closest intersection point ahead on the ray in the ray direction
    if (intersections.length > 0) {
      
      let closestIntersection = null;
      let minDot = Infinity;
      
      for (let intersection of intersections) {
        const dx = intersection.x - currentX;
        const dy = intersection.y - currentY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0.1) { // Avoid stepping to same point
          // Check if intersection is in ray direction
          const dotProduct = (dx * rayUx + dy * rayUy);
          if (dotProduct > 0.1 && dotProduct < minDot) { // Must be forward and closest in ray direction
            minDot = dotProduct;
            closestIntersection = intersection;
          }
        }
      }
      
      if (closestIntersection) {
        currentX = closestIntersection.x;
        currentY = closestIntersection.y;
        stepPoints.push({x: currentX, y: currentY});
      } else {
        break; // No valid intersection ahead
      }
    } else {
      break; // No intersection
    }
  }
  
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
  if (stepPoints.length > 1) {
    const currentPt = stepPoints[stepPoints.length - 1];
    
    // Find closest heightmap point to current stepping position
    let closestIndex = 0;
    let closestDist = Infinity;
    for (let i = 0; i < heightmap.length; i++) {
      const ptX = params.sideViewPadding + i * pointSpacing;
      const dist = Math.abs(currentPt.x - ptX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    }
    
    const cone = coneMap[closestIndex];
    const coneX = params.sideViewPadding + closestIndex * pointSpacing;
    const coneHeightY = params.sideViewPadding + viewHeight_canvas - heightmap[closestIndex] * scaleFactor * viewHeight_canvas;
    
    const coneAngle = cone.angle;
    const effectiveViewHeight = viewHeight_canvas * scaleFactor;
    const slopePixels = Math.tan(coneAngle) * (effectiveViewHeight / pointSpacing);
    
    // Draw cone edges in purple
    const leftEdge = clipLineToBox(coneX, coneHeightY, -1, -slopePixels, boxMinX, boxMinY, boxMaxX, boxMaxY);
    if (leftEdge) {
      stroke(200, 100, 200);
      strokeWeight(2);
      line(leftEdge.startX, leftEdge.startY, leftEdge.endX, leftEdge.endY);
    }
    
    const rightEdge = clipLineToBox(coneX, coneHeightY, 1, -slopePixels, boxMinX, boxMinY, boxMaxX, boxMaxY);
    if (rightEdge) {
      stroke(200, 100, 200);
      strokeWeight(2);
      line(rightEdge.startX, rightEdge.startY, rightEdge.endX, rightEdge.endY);
    }
    
    // Apex point
    fill(200, 100, 200);
    noStroke();
    circle(coneX, coneHeightY, 10);
  }
}
