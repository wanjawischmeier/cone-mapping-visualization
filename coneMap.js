import { params } from './config.js';
import { state } from './state.js';

export class Cone {
	constructor(height, leftSlope, rightSlope, index) {
		this.height = height;
		this.leftSlope = leftSlope;    // Slope for left edge of cone
		this.rightSlope = rightSlope;  // Slope for right edge of cone
		this.index = index;
	}

	// Create isotropic cone (same slope on both sides)
	static isotropic(height, maxSlope, index) {
		return new Cone(height, maxSlope, maxSlope, index);
	}

	// Create anisotropic cone (different slopes on each side)
	static anisotropic(height, leftSlope, rightSlope, index) {
		return new Cone(height, leftSlope, rightSlope, index);
	}

	// Get screen position for cone apex in the visualization
	getScreenPosition(pointSpacing, viewHeight, sideViewPadding) {
		const x = sideViewPadding + this.index * pointSpacing;
		const y = sideViewPadding + viewHeight - this.height * (params.heightmapScale / 100) * viewHeight;
		return { x, y };
	}

	// Get pixel-space slopes for the visual representation
	// This represents the actual dh/dx slope on the canvas
	getScreenSlopes(pointSpacing, viewHeight) {
		const scaleFactor = params.heightmapScale / 100;
		return {
			pixelLeftSlope: this.leftSlope * scaleFactor * viewHeight / pointSpacing,
			pixelRightSlope: this.rightSlope * scaleFactor * viewHeight / pointSpacing
		};
	}
}

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

	// Clear stepping data when new cone map is generated
	state.steppingData = { stepPoints: [], currentConeIndex: -1, pointSpacing: 0, t_save_point: null, t_fail_point: null, has_hit: false };
	state.lastSteppingData = { stepPoints: [], currentConeIndex: -1, pointSpacing: 0, t_save_point: null, t_fail_point: null, has_hit: false };

	// Enable cone stepping when cone map is generated
	state.steppingRunning = true;
}
