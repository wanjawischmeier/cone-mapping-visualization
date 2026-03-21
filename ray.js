// ============================================================================
// RAY-CONE INTERSECTION
// ============================================================================
function rayConeConeIntersection(rayX1, rayY1, rayX2, rayY2, coneX, coneY, coneAngle, pointSpacing, viewHeight) {
  // Ray defined by two points (x1,y1) and (x2,y2)
  // Cone defined by origin at (coneX, coneY), with half-angle coneAngle
  // Cone is infinitely tall and extends upward
  
  const intersections = [];
  
  // Ray direction
  const rayDx = rayX2 - rayX1;
  const rayDy = rayY2 - rayY1;
  const rayLen = Math.sqrt(rayDx * rayDx + rayDy * rayDy);
  
  if (rayLen === 0) return []; // degenerate ray
  
  const rayUx = rayDx / rayLen;
  const rayUy = rayDy / rayLen;
  
  // Cone parameters
  const scaleFactor = params.heightmapScale / 100;
  const effectiveViewHeight = viewHeight * scaleFactor;
  const slopePixels = Math.tan(coneAngle) * (effectiveViewHeight / pointSpacing);
  
  // For a cone with infinite height, we only check intersections with the two cone edges (lines forming the cone)
  
  // Cone left edge: infinitely extended line from (coneX - radius, coneY - height) through (coneX, coneY)
  // Actually, for infinite cone: the line passes through (coneX, coneY) with slope = -slopePixels / dx = up-left direction
  // The cone expands, so left edge goes from (coneX, coneY) upward-left with slope -slopePixels
  
  // For a more general definition:
  // Left edge line: y - coneY = slopePixels * (x - coneX) for x <= coneX (slanting up-left)
  // Right edge line: y - coneY = -slopePixels * (x - coneX) for x >= coneX (slanting up-right)
  
  // But we need to be careful about the direction. The cone expands upward.
  // So: Left edge has slope -slopePixels (going up and left from apex)
  //     Right edge has slope +slopePixels (going up and right from apex)
  
  const leftEdgeSlope = slopePixels;  // y changes at this rate per unit x
  const rightEdgeSlope = -slopePixels;
  
  // Find intersections with ray
  let leftIntersection = rayInfiniteLineIntersection(rayX1, rayY1, rayX2, rayY2, coneX, coneY, leftEdgeSlope, true);
  let rightIntersection = rayInfiniteLineIntersection(rayX1, rayY1, rayX2, rayY2, coneX, coneY, rightEdgeSlope, false);
  
  if (leftIntersection) {
    intersections.push(leftIntersection);
  }
  if (rightIntersection) {
    intersections.push(rightIntersection);
  }
  
  return intersections;
}

// Helper: find intersection of ray with an infinite line (cone edge)
// For left edge: cone edge goes through (coneX, coneY) with given slope (expanding left-upward)
// For right edge: cone edge goes through (coneX, coneY) with given slope (expanding right-upward)
function rayInfiniteLineIntersection(rayX1, rayY1, rayX2, rayY2, lineX, lineY, lineSlope, isLeftEdge) {
  const rayDx = rayX2 - rayX1;
  const rayDy = rayY2 - rayY1;
  
  // Line equation: y - lineY = lineSlope * (x - lineX)
  // Ray equation: (x, y) = (rayX1, rayY1) + t * (rayDx, rayDy)
  
  // Substituting ray into line:
  // rayY1 + t*rayDy - lineY = lineSlope * (rayX1 + t*rayDx - lineX)
  // rayY1 + t*rayDy - lineY = lineSlope*rayX1 - lineSlope*lineX + t*lineSlope*rayDx
  // t*rayDy - t*lineSlope*rayDx = lineSlope*rayX1 - lineSlope*lineX - rayY1 + lineY
  // t*(rayDy - lineSlope*rayDx) = lineSlope*(rayX1 - lineX) - (rayY1 - lineY)
  
  const denom = rayDy - lineSlope * rayDx;
  
  if (Math.abs(denom) < 1e-6) return null; // parallel
  
  const t = (lineSlope * (rayX1 - lineX) - (rayY1 - lineY)) / denom;
  
  // Only accept intersections along the ray direction (t > 0)
  // We use a small epsilon to avoid floating point precision issues near the origin
  if (t < -0.0001) return null;
  
  const ix = rayX1 + t * rayDx;
  const iy = rayY1 + t * rayDy;
  
  // Only return intersection if it's on the upward expanding part of the cone
  // Y goes down in canvas, so smaller Y means higher up
  if (iy > lineY + 0.1) return null;
  
  return { x: ix, y: iy };
}
