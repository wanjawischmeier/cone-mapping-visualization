import { params } from '../../config.js';
import { coneMap, state } from '../../state.js';
import { drawCheckbox } from './checkbox.js';
import { drawSlider } from './slider.js';
import { drawButton } from './button.js';
import { saveState } from '../../storage.js';
import { generateRandomHeightmap } from '../../heightmap.js';

export function drawVisualizationSettings(x, y, contentWidth) {
	let currentY = y;
	
	// Section header
	fill(0);
	noStroke();
	textSize(12);
	textStyle(BOLD);
    textAlign(LEFT);
	text("VISUALIZATION", x, currentY);
	textStyle(NORMAL);
	currentY += 20;
	
	// Cone stepping run/pause button
	const steppingButtonDisabled = state.coneMap.length === 0;
	const steppingLabel = state.steppingRunning ? "Pause Stepping" : "Run Stepping";
	
	if (drawButton(steppingLabel, x, currentY, contentWidth, 30, steppingButtonDisabled)) {
		// Save current stepping data when pausing
		if (state.steppingRunning) {
			// Save the current ray position and stepping data
			state.lastRay = {
				x1: state.ray.x1,
				y1: state.ray.y1,
				x2: state.ray.x2,
				y2: state.ray.y2
			};
			state.lastSteppingData = {
				stepPoints: [...state.steppingData.stepPoints],
				currentConeIndex: state.steppingData.currentConeIndex,
				pointSpacing: state.steppingData.pointSpacing,
				t_save_point: state.steppingData.t_save_point,
				t_fail_point: state.steppingData.t_fail_point,
				has_hit: state.steppingData.has_hit
			};
			// Clear current stepping data so only last state is shown
			state.steppingData = { stepPoints: [], currentConeIndex: -1, pointSpacing: 0, t_save_point: null, t_fail_point: null, has_hit: false };
		}
		state.steppingRunning = !state.steppingRunning;
	}
	currentY += 50;
	
	
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
	
	// Sliders for visualization parameters
	textSize(10);
	
	currentY = drawSlider("Height Scale:", params.heightmapScale, 10, 200, x, currentY, contentWidth, (val) => {
		params.heightmapScale = val;
		saveState();
	});

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
	
	return currentY + 20;
}
