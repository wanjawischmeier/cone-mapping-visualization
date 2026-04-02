import { params } from '../../config.js';
import { coneMap, state } from '../../state.js';
import { drawToggleButtonPair } from './toggleButtonPair.js';
import { drawCheckbox } from './checkbox.js';
import { drawButton } from './button.js';
import { drawConeMapStatus } from './coneMapStatus.js';
import { clearConeMapAndStepping } from '../../coneMap.js';
import { saveState } from '../../storage.js';
import { generateConeMap } from '../../coneMap.js';
import { isMouseClicked } from '../inputEvents.js';
import { colors } from '../../config.js';

export function drawConeMapSettings(x, y, contentWidth) {
	let currentY = y;
	
	// Section header
	fill(colors.text);
	noStroke();
	textSize(12);
	textStyle(BOLD);
    textAlign(LEFT);
	text("CONE MAP", x, currentY);
	textStyle(NORMAL);
	currentY += 20;
	
	// Generate Cone Map Button
	const coneMapExists = coneMap.length > 0;
	if (isMouseClicked(x, currentY, contentWidth, 30) && !coneMapExists) {
		generateConeMap();
	}
	drawButton("Generate Cone Map", x, currentY, contentWidth, 30, coneMapExists);
	
	// Cone map status indicator
	drawConeMapStatus(x, currentY + 40, contentWidth);
	
	currentY += 50;
	
	// Cone mode selector
	currentY = drawToggleButtonPair(
		"Cone Mode:",
		"Isotropic",
		"Anisotropic",
		params.coneMode,
		'isotropic',
		'anisotropic',
		x,
		currentY,
		contentWidth,
		(newMode) => {
			params.coneMode = newMode;
			clearConeMapAndStepping();
			saveState();
		}
	);
	
	// Cone generation mode selector
	currentY = drawToggleButtonPair(
		"Generation:",
		"Conservative",
		"Exact Relaxed",
		params.coneGenerationMode,
		'conservative',
		'exactRelaxed',
		x,
		currentY,
		contentWidth,
		(newMode) => {
			params.coneGenerationMode = newMode;
			clearConeMapAndStepping();
			saveState();
		}
	);
	
	// Bilinear fix checkbox
	if (drawCheckbox("Bilinear Fix", params.applyBilinearFix, x, currentY)) {
		params.applyBilinearFix = !params.applyBilinearFix;
		clearConeMapAndStepping();
		saveState();
	}
	currentY += 30;
	
	// Interpolate heightmap checkbox
	if (drawCheckbox("Interpolate Heightmap", state.uiState.heightmapInterpolated, x, currentY)) {
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
