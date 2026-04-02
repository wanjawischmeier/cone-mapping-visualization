import { coneMap, state } from '../../state.js';
import { drawCheckbox } from './checkbox.js';
import { saveState } from '../../storage.js';
import { clearConeMapAndStepping } from '../../coneMap.js';

export function drawVisibilityToggles(x, y) {
	let currentY = y;
	
	// Toggle Ray visibility
	if (drawCheckbox("Show Ray", state.uiState.showRay, x, currentY)) {
		state.uiState.toggleRay();
		saveState();
	}
	currentY += 30;
	
	// Toggle Cone Stepping visibility (disabled if Show Ray is off or no cone map)
	const coneSteppingDisabled = !state.uiState.showRay || coneMap.length === 0;
	if (drawCheckbox("Show Cone Stepping", state.uiState.showConeStepping, x, currentY, coneSteppingDisabled)) {
		state.uiState.toggleConeStepping();
		saveState();
	}
	currentY += 30;
	
	// Toggle Hovered Cone visibility (disabled if no cone map)
	const hoveredConeDisabled = coneMap.length === 0;
	if (drawCheckbox("Show Hovered Cone", state.uiState.showHoveredCone, x, currentY, hoveredConeDisabled)) {
		state.uiState.toggleHoveredCone();
		saveState();
	}
	currentY += 30;
	
	// Toggle Heightmap interpolation mode
	if (drawCheckbox("Heightmap Interpolated", state.uiState.heightmapInterpolated, x, currentY)) {
		state.uiState.toggleHeightmapMode();
		// Clear cone map so it reflects the new interpolation setting
		if (coneMap.length > 0) {
			clearConeMapAndStepping();
		}
		saveState();
	}
	currentY += 30;
	
	return currentY + 20;
}
