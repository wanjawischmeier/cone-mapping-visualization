// ============================================================================
// HEIGHTMAP GENERATION
// ============================================================================
function generateRandomHeightmap() {
  heightmap = [];
  for (let i = 0; i < params.heightmapResolution; i++) {
    // Generate noise scaled by noise power
    const noise = random(0, 1) * params.heightmapNoisePower;
    // Calculate slope y at this position (interpolate from start to end)
    const t = params.heightmapResolution > 1 ? i / (params.heightmapResolution - 1) : 0;
    const slopeY = params.heightmapSlopeStart + (params.heightmapSlopeEnd - params.heightmapSlopeStart) * t;
    // Add slope to noise and clamp
    const height = Math.min(1, Math.max(0, noise + slopeY));
    heightmap.push(height);
  }
  coneMap = undefined; // Reset cone map when generating new heightmap
  hoveredIndex = -1;
}
