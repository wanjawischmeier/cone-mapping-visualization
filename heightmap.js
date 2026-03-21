// ============================================================================
// HEIGHTMAP GENERATION
// ============================================================================
function generateRandomHeightmap() {
  heightmap = [];
  for (let i = 0; i < params.heightmapResolution; i++) {
    heightmap.push(random(0, 1));
  }
  coneMap = undefined; // Reset cone map when generating new heightmap
  hoveredIndex = -1;
}
