import { params } from '../../config.js';
import { state } from '../../state.js';
import { drawSlider } from './slider.js';
import { generateRandomHeightmap } from '../../heightmap.js';
import { saveState } from '../../storage.js';
import { colors } from '../../config.js';

export function drawParametersSection(x, y, contentWidth) {
	let currentY = y;
	
	fill(colors.text);
	noStroke();
	textSize(11);
	textStyle(BOLD);
	text("Parameters:", x, currentY);
	textStyle(NORMAL);
	currentY += 20;
	
	textSize(10);
	
	currentY = drawSlider("Resolution:", params.heightmapResolution, 10, 100, x, currentY, contentWidth, (val) => {
		params.heightmapResolution = Math.floor(val);
	}, () => { generateRandomHeightmap(); saveState(); });

	currentY = drawSlider("Height Scale:", params.heightmapScale, 10, 200, x, currentY, contentWidth, (val) => {
		params.heightmapScale = val;
	}, () => { generateRandomHeightmap(); saveState(); });

	currentY = drawSlider("Point Size:", params.pointSize, 3, 15, x, currentY, contentWidth, (val) => {
		params.pointSize = val;
		saveState();
	});

	currentY = drawSlider("Line Weight:", params.lineWeight, 1, 5, x, currentY, contentWidth, (val) => {
		params.lineWeight = val;
		saveState();
	});

	currentY = drawSlider("Max Iterations (n):", params.rayIterations, 1, 50, x, currentY, contentWidth, (val) => {
		const previousMax = params.rayIterations;
		params.rayIterations = Math.floor(val);
		saveState();

		// If slider was at maximum, jump it to the new maximum
		if (state.currentIteration === previousMax - 1) {
			state.currentIteration = params.rayIterations - 1;
		} else if (state.currentIteration > params.rayIterations - 1) {
			// If it exceeds the new max, clamp it
			state.currentIteration = params.rayIterations - 1;
		}
	});

	currentY = drawSlider("Slope Start:", params.heightmapSlopeStart, -1, 1, x, currentY, contentWidth, (val) => {
		params.heightmapSlopeStart = val;
	}, () => { generateRandomHeightmap(); saveState(); });

	currentY = drawSlider("Slope End:", params.heightmapSlopeEnd, -1, 1, x, currentY, contentWidth, (val) => {
		params.heightmapSlopeEnd = val;
	}, () => { generateRandomHeightmap(); saveState(); });

	currentY = drawSlider("Noise Power:", params.heightmapNoisePower, 0, 1, x, currentY, contentWidth, (val) => {
		params.heightmapNoisePower = val;
	}, () => { generateRandomHeightmap(); saveState(); });
	
	return currentY;
}
