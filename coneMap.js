import { params } from './config.js';
import { state } from './state.js';

// ============================================================================
// CONE CLASS
// ============================================================================
export class Cone {
  // Store left and right angles separately to support both isotropic and anisotropic cones
  constructor(height, leftAngle, rightAngle, radius, index) {
    this.height = height;
    this.leftAngle = leftAngle;    // Angle for left edge of cone
    this.rightAngle = rightAngle;  // Angle for right edge of cone
    this.radius = radius;
    this.index = index;
  }

  // Create isotropic cone (same angle on both sides)
  static isotropic(height, maxSlope, index) {
    const radius = maxSlope > 0 ? 1.0 / maxSlope : 1.0;
    const angle = Math.atan(maxSlope);
    return new Cone(height, angle, angle, radius, index);
  }

  // Create anisotropic cone (different angles on each side)
  static anisotropic(height, leftSlope, rightSlope, index) {
    const leftAngle = Math.atan(leftSlope);
    const rightAngle = Math.atan(rightSlope);
    const maxSlope = Math.max(leftSlope, rightSlope);
    const radius = maxSlope > 0 ? 1.0 / maxSlope : 1.0;
    return new Cone(height, leftAngle, rightAngle, radius, index);
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
export function generateConeMap() {
  if (state.heightmap.length === 0) {
    console.warn("Cannot generate cone map: heightmap is empty");
    return;
  }

  state.coneMap.length = 0;

  if (params.coneMode === 'isotropic') {
    // Isotropic: same angle on both sides
    for (let i = 0; i < state.heightmap.length; i++) {
      let maxSlope = 0; // steepest slope found

      // Check all other points
      for (let j = 0; j < state.heightmap.length; j++) {
        if (i === j) continue;

        const dx = Math.abs(j - i); // horizontal distance in samples
        const dh = state.heightmap[j] - state.heightmap[i]; // absolute height difference
        const slope = dh / dx; // slope to this point

        // Track the steepest slope (most constraining)
        maxSlope = Math.max(maxSlope, slope);
      }

      state.coneMap.push(Cone.isotropic(state.heightmap[i], maxSlope, i));
    }
  } else if (params.coneMode === 'anisotropic') {
    // Anisotropic: potentially different angles on left and right
    for (let i = 0; i < state.heightmap.length; i++) {
      let leftSlope = 0;  // steepest upslope to the left
      let rightSlope = 0; // steepest upslope to the right

      // Check points to the left
      for (let j = 0; j < i; j++) {
        const dx = i - j; // distance to the left
        const dh = state.heightmap[j] - state.heightmap[i];
        const slope = dh / dx;
        leftSlope = Math.max(leftSlope, slope);
      }

      // Check points to the right
      for (let j = i + 1; j < state.heightmap.length; j++) {
        const dx = j - i; // distance to the right
        const dh = state.heightmap[j] - state.heightmap[i];
        const slope = dh / dx;
        rightSlope = Math.max(rightSlope, slope);
      }

      state.coneMap.push(Cone.anisotropic(state.heightmap[i], leftSlope, rightSlope, i));
    }
  }
  
  console.log(`Generated ${params.coneMode} cone map`);
}
