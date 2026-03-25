// ============================================================================
// LINE CLASS
// ============================================================================
class Line {
  constructor(x, y, slope) {
    this.x = x;
    this.y = y;
    this.slope = slope;
  }
}

// ============================================================================
// RAY CLASS
// ============================================================================
class Ray {
  constructor(x1 = 150, y1 = 100, x2 = 300, y2 = 400) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }

  // Get direction vector
  getDirection() {
    return {
      dx: this.x2 - this.x1,
      dy: this.y2 - this.y1
    };
  }

  // Get length of ray
  getLength() {
    const { dx, dy } = this.getDirection();
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Get normalized direction vector
  getNormalizedDirection() {
    const len = this.getLength();
    if (len === 0) return { ux: 0, uy: 0 };
    const { dx, dy } = this.getDirection();
    return { ux: dx / len, uy: dy / len };
  }

  // Set endpoint 0
  setPoint1(x, y) {
    this.x1 = x;
    this.y1 = y;
  }

  // Set endpoint 1
  setPoint2(x, y) {
    this.x2 = x;
    this.y2 = y;
  }

  // Check if point is near either endpoint
  isNearPoint(x, y, distance) {
    const dist1 = Math.hypot(x - this.x1, y - this.y1);
    const dist2 = Math.hypot(x - this.x2, y - this.y2);
    return {
      point1: dist1 < distance,
      point2: dist2 < distance
    };
  }

  // Find intersections with a cone
  getIntersectionsWithCone(cone, pointSpacing, viewHeight, sideViewPadding) {
    const { x: coneX, y: coneY } = cone.getScreenPosition(pointSpacing, viewHeight, sideViewPadding);
    const intersections = [];
    
    // Cone parameters
    const scaleFactor = params.heightmapScale / 100;
    const effectiveViewHeight = viewHeight * scaleFactor;
    const slopePixels = Math.tan(cone.angle) * (effectiveViewHeight / pointSpacing);
    
    // Create left and right edge lines
    const leftEdge = new Line(coneX, coneY, slopePixels);
    const rightEdge = new Line(coneX, coneY, -slopePixels);
    
    // Find intersections with both cone edges
    const leftIntersection = this._intersectWithLine(leftEdge);
    const rightIntersection = this._intersectWithLine(rightEdge);
    
    if (leftIntersection) intersections.push(leftIntersection);
    if (rightIntersection) intersections.push(rightIntersection);
    
    return intersections;
  }

  // Helper: Find intersection with a line
  _intersectWithLine(line) {
    const rayDx = this.x2 - this.x1;
    const rayDy = this.y2 - this.y1;
    
    const denom = rayDy - line.slope * rayDx;
    
    if (Math.abs(denom) < 1e-6) return null; // parallel
    
    const t = (line.slope * (this.x1 - line.x) - (this.y1 - line.y)) / denom;
    
    // Only accept intersections along the ray direction (t > 0)
    if (t < -0.0001) return null;
    
    const ix = this.x1 + t * rayDx;
    const iy = this.y1 + t * rayDy;
    
    // Only return intersection if it's on the upward expanding part of the cone
    if (iy > line.y + 0.1) return null;
    
    return { x: ix, y: iy };
  }
}

