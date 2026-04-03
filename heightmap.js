import { params } from './config.js';
import { state } from './state.js';
import { saveState } from './storage.js';

export function generateRandomHeightmap() {
	// Reseed the noise generator so we get different patterns each time
	noiseSeed(Math.random() * 10000);

	state.heightmap.length = 0; // Clear the array
	for (let i = 0; i < params.heightmapResolution; i++) {
		// Generate Perlin noise with smoothness control via scale
		const noiseValue = noise(i * params.heightmapNoiseScale);
		const noiseScaled = noiseValue * params.heightmapNoisePower;
		
		// Calculate slope y at this position (interpolate from start to end)
		const t = params.heightmapResolution > 1 ? i / (params.heightmapResolution - 1) : 0;
		const slopeY = params.heightmapSlopeStart + (params.heightmapSlopeEnd - params.heightmapSlopeStart) * t;
		
		// Add slope to noise and clamp
		const height = Math.min(1, Math.max(0, noiseScaled + slopeY));
		state.heightmap.push(height);
	}
	state.coneMap.length = 0; // Reset cone map when generating new heightmap
	state.hoveredIndex = -1;
	state.steppingData = { stepPoints: [], currentConeIndex: -1, pointSpacing: 0, t_save_point: null, t_fail_point: null, has_hit: false }; // Clear current stepping data
	state.lastSteppingData = { stepPoints: [], currentConeIndex: -1, pointSpacing: 0, t_save_point: null, t_fail_point: null, has_hit: false }; // Clear last stepping data
	
	// Save the new heightmap to storage
	saveState();
}
