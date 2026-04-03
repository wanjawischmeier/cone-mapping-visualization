import { params } from '../../config.js';
import { coneMap, state } from '../../state.js';
import { drawToggleButtonPair } from './toggleButtonPair.js';
import { drawCheckbox } from './checkbox.js';
import { drawSlider } from './slider.js';
import { drawButton } from './button.js';
import { drawConeMapStatus } from './coneMapStatus.js';
import { clearConeMapAndStepping } from '../../coneMap.js';
import { saveState } from '../../storage.js';
import { generateRandomHeightmap } from '../../heightmap.js';
import { generateConeMap } from '../../coneMap.js';
import { isMouseClicked } from '../inputEvents.js';
import { colors } from '../../config.js';

export function drawGenerationSettings(x, y, contentWidth) {
	let currentY = y;
	
	// Section header
	fill(colors.text);
	noStroke();
	textSize(12);
	textStyle(BOLD);
    textAlign(LEFT);
	text("GENERATION", x, currentY);
	textStyle(NORMAL);
	currentY += 20;
	
	// Generate Heightmap Button
	if (drawButton("Generate Heightmap", x, currentY, contentWidth, 30)) {
		generateRandomHeightmap();
	}
	currentY += 50;
	
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
	
	// Heightmap interpolation checkbox
	if (drawCheckbox("Heightmap Interpolated", state.uiState.heightmapInterpolated, x, currentY)) {
		state.uiState.toggleHeightmapMode();
		// Clear cone map so it reflects the new interpolation setting
		if (coneMap.length > 0) {
			clearConeMapAndStepping();
		}
		saveState();
	}
	currentY += 30;
	
	// Sliders for generation parameters
	textSize(10);
	
	currentY = drawSlider("Resolution:", params.heightmapResolution, 10, 100, x, currentY, contentWidth, (val) => {
		params.heightmapResolution = Math.floor(val);
	}, generateRandomHeightmap);

	currentY = drawSlider("Slope Start:", params.heightmapSlopeStart, -1, 1, x, currentY, contentWidth, (val) => {
		params.heightmapSlopeStart = val;
	}, generateRandomHeightmap);

	currentY = drawSlider("Slope End:", params.heightmapSlopeEnd, -1, 1, x, currentY, contentWidth, (val) => {
		params.heightmapSlopeEnd = val;
	}, generateRandomHeightmap);

	currentY = drawSlider("Noise Power:", params.heightmapNoisePower, 0, 1, x, currentY, contentWidth, (val) => {
		params.heightmapNoisePower = val;
	}, generateRandomHeightmap);

	currentY = drawSlider("Noise Smoothness:", params.heightmapNoiseScale, 0.01, 0.5, x, currentY, contentWidth, (val) => {
		params.heightmapNoiseScale = val;
	}, generateRandomHeightmap);
	
	return currentY + 20;
}
