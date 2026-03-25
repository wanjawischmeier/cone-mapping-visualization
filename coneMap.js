// ============================================================================
// CONE CLASS
// ============================================================================
class Cone {
  constructor(height, angle, radius, index) {
    this.height = height;
    this.angle = angle;
    this.radius = radius;
    this.index = index;
  }

  // Create from height and slope
  static fromSlope(height, maxSlope, index) {
    const radius = maxSlope > 0 ? 1.0 / maxSlope : 1.0;
    const angle = Math.atan(maxSlope);
    return new Cone(height, angle, radius, index);
  }

  // Get screen position for this cone in the visualization
  getScreenPosition(pointSpacing, viewHeight, sideViewPadding) {
    const x = sideViewPadding + this.index * pointSpacing;
    const y = sideViewPadding + viewHeight - this.height * (params.heightmapScale / 100) * viewHeight;
    return { x, y };
  }
}

// ============================================================================
// CONE MAP GENERATION
// ============================================================================
function generateConeMap() {
  if (heightmap === undefined) {
    console.warn("Cannot generate cone map: heightmap is undefined");
    return;
  }

  coneMap = [];

  // Classic brute force cone stepping algorithm
  // For each point, find the steepest slope to any other point (up or down)
  // This defines the maximum safe cone angle
  for (let i = 0; i < heightmap.length; i++) {
    let maxSlope = 0; // steepest slope found

    // Check all other points
    for (let j = 0; j < heightmap.length; j++) {
      if (i === j) continue;

      const dx = Math.abs(j - i); // horizontal distance in samples
      const dh = heightmap[j] - heightmap[i]; // absolute height difference
      const slope = dh / dx; // slope to this point

      // Track the steepest slope (most constraining)
      maxSlope = Math.max(maxSlope, slope);
    }

    // Create cone using the factory method
    coneMap.push(Cone.fromSlope(heightmap[i], maxSlope, i));
  }
  
  console.log("Generated cone map with proper cone stepping slopes");
}
