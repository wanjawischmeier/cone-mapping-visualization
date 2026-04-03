import { coneMap } from '../../state.js';
import { generateRandomHeightmap } from '../../heightmap.js';
import { generateConeMap } from '../../coneMap.js';
import { drawButton } from './button.js';
import { drawConeMapStatus } from './coneMapStatus.js';

export function drawGenerationButtons(x, y, contentWidth) {
	let currentY = y;
	
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
	
	return currentY + 50;
}
