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

	// Choose generation algorithm
	if (params.coneGenerationMode === 'exactRelaxed') {
		generateConeMapExactRelaxed();
	} else {
		generateConeMapConservative();
	}

	console.log(`Generated ${params.coneMode} cone map using ${params.coneGenerationMode} mode`);

	// Apply bilinear fix if enabled
	if (params.applyBilinearFix) {
		applyBilinearFix();
	}

	// Clear stepping data when new cone map is generated
	state.steppingData = { stepPoints: [], currentConeIndex: -1, pointSpacing: 0, t_save_point: null, t_fail_point: null, has_hit: false };
	state.lastSteppingData = { stepPoints: [], currentConeIndex: -1, pointSpacing: 0, t_save_point: null, t_fail_point: null, has_hit: false };

	// Enable cone stepping when cone map is generated
	state.steppingRunning = true;
}

// Conservative cone map: straight distance/height ratio to all points
function generateConeMapConservative() {
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

		if (params.coneMode === 'isotropic') {
			const maxSlope = Math.max(leftSlope, rightSlope);
			state.coneMap.push(Cone.isotropic(state.heightmap[i], maxSlope, i));
		} else if (params.coneMode === 'anisotropic') {
			state.coneMap.push(Cone.anisotropic(state.heightmap[i], leftSlope, rightSlope, i));
		}
	}
}

// Exact relaxed cone map: only count "falling edges" (local maxima)
// Adapted from "Robust Cone Step Mapping" paper main_new_fallingEdge
function generateConeMapExactRelaxed() {
	const n = state.heightmap.length;

	for (let baseIdx = 0; baseIdx < n; baseIdx++) {
		const baseH = state.heightmap[baseIdx];
		let leftSlope = 0;
		let rightSlope = 0;

		// Search left for falling edges
		for (let j = 0; j < baseIdx; j++) {
			const dx = baseIdx - j;
			const h = state.heightmap[j];
			const dh = h - baseH;

			// Only consider points above base
			if (dh > 0) {
				// Check if this is a limiting vertex (falling edge)
				// A point is a limiting vertex if it's higher than at least one neighbor
				const hLeft = j > 0 ? state.heightmap[j - 1] : baseH;
				const hRight = h; // The current point itself

				const isLimitingVertex = h > hLeft || (j < baseIdx - 1 && h > state.heightmap[j + 1]);

				if (isLimitingVertex) {
					const slope = dx / dh;
					leftSlope = Math.max(leftSlope, slope);
				}
			}
		}

		// Search right for falling edges
		for (let j = baseIdx + 1; j < n; j++) {
			const dx = j - baseIdx;
			const h = state.heightmap[j];
			const dh = h - baseH;

			// Only consider points above base
			if (dh > 0) {
				// Check if this is a limiting vertex (falling edge)
				const hLeft = h; // The current point itself
				const hRight = j < n - 1 ? state.heightmap[j + 1] : baseH;

				const isLimitingVertex = h > hRight || (j > baseIdx + 1 && h > state.heightmap[j - 1]);

				if (isLimitingVertex) {
					const slope = dx / dh;
					rightSlope = Math.max(rightSlope, slope);
				}
			}
		}

		if (params.coneMode === 'isotropic') {
			const maxSlope = Math.max(leftSlope, rightSlope);
			state.coneMap.push(Cone.isotropic(baseH, maxSlope, baseIdx));
		} else if (params.coneMode === 'anisotropic') {
			state.coneMap.push(Cone.anisotropic(baseH, leftSlope, rightSlope, baseIdx));
		}
	}
}

// Apply bilinear fix from robust cone stepping paper
// Each slope becomes the steepest (maximum value) of itself and its 2 immediate neighbors
// Must capture original slopes first to avoid propagating values across the map
function applyBilinearFix() {
	const n = state.coneMap.length;
	if (n < 2) return; // No neighbors to check

	// Save original slopes before modifying
	const originalLeft = state.coneMap.map(cone => cone.leftSlope);
	const originalRight = state.coneMap.map(cone => cone.rightSlope);

	if (params.coneMode === 'isotropic') {
		// For isotropic mode, update each cone's slope based on original values
		for (let i = 0; i < n; i++) {
			let maxSlope = originalLeft[i]; // Start with current slope
			
			// Check left neighbor's original slope
			if (i > 0) {
				maxSlope = Math.max(maxSlope, originalLeft[i - 1]);
			}
			
			// Check right neighbor's original slope
			if (i < n - 1) {
				maxSlope = Math.max(maxSlope, originalLeft[i + 1]);
			}
			
			// Update both left and right slopes (same in isotropic mode)
			state.coneMap[i].leftSlope = maxSlope;
			state.coneMap[i].rightSlope = maxSlope;
		}
	} else if (params.coneMode === 'anisotropic') {
		// For anisotropic mode, update left and right slopes independently based on original values
		for (let i = 0; i < n; i++) {
			let maxLeftSlope = originalLeft[i];
			let maxRightSlope = originalRight[i];
			
			// Check left neighbor's original slopes
			if (i > 0) {
				maxLeftSlope = Math.max(maxLeftSlope, originalLeft[i - 1]);
				maxRightSlope = Math.max(maxRightSlope, originalRight[i - 1]);
			}
			
			// Check right neighbor's original slopes
			if (i < n - 1) {
				maxLeftSlope = Math.max(maxLeftSlope, originalLeft[i + 1]);
				maxRightSlope = Math.max(maxRightSlope, originalRight[i + 1]);
			}
			
			// Update slopes
			state.coneMap[i].leftSlope = maxLeftSlope;
			state.coneMap[i].rightSlope = maxRightSlope;
		}
	}
}
