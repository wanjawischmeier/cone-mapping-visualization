import { params } from './config.js';
import { state } from './state.js';

export function generateRandomHeightmap() {
	state.heightmap.length = 0; // Clear the array
	for (let i = 0; i < params.heightmapResolution; i++) {
		// Generate noise scaled by noise power
		const noise = random(0, 1) * params.heightmapNoisePower;
		// Calculate slope y at this position (interpolate from start to end)
		const t = params.heightmapResolution > 1 ? i / (params.heightmapResolution - 1) : 0;
		const slopeY = params.heightmapSlopeStart + (params.heightmapSlopeEnd - params.heightmapSlopeStart) * t;
		// Add slope to noise and clamp
		const height = Math.min(1, Math.max(0, noise + slopeY));
		state.heightmap.push(height);
	}
	state.coneMap.length = 0; // Reset cone map when generating new heightmap
	state.hoveredIndex = -1;
	state.steppingData = { stepPoints: [], currentConeIndex: -1, pointSpacing: 0 }; // Clear current stepping data
	state.lastSteppingData = { stepPoints: [], currentConeIndex: -1, pointSpacing: 0 }; // Clear last stepping data
}
