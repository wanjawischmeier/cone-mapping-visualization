import { params } from '../../config.js';
import { state } from '../../state.js';
import { drawCheckbox } from './checkbox.js';
import { drawSlider } from './slider.js';
import { drawButton } from './button.js';
import { generateRandomHeightmap } from '../../heightmap.js';
import { colors } from '../../config.js';

export function drawHeightmapSettings(x, y, contentWidth) {
	let currentY = y;
	
	// Section header
	fill(colors.text);
	noStroke();
	textSize(12);
	textStyle(BOLD);
    textAlign(LEFT);
	text("HEIGHTMAP", x, currentY);
	textStyle(NORMAL);
	currentY += 20;
	
	// Generate Heightmap Button
	if (drawButton("Generate Heightmap", x, currentY, contentWidth, 30)) {
		generateRandomHeightmap();
	}
	currentY += 50;
	
	// Sliders for heightmap parameters
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
