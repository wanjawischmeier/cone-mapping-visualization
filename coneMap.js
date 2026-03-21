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

    // maxSlope is the tangent of the cone half-angle
    // cone radius in data space = 1.0 / maxSlope (inverted for visualization)
    const coneRadius = maxSlope > 0 ? 1.0 / maxSlope : 1.0;

    coneMap.push({
      height: heightmap[i],
      angle: Math.atan(maxSlope),
      radius: coneRadius,
      index: i
    });
  }
  
  console.log("Generated cone map with proper cone stepping slopes");
}
