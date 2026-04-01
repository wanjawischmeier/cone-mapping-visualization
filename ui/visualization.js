import { params } from '../config.js';
import { state } from '../state.js';
import { Ray } from '../ray.js';
import { getHeightAndCone } from '../coneStepping.js';
import { drawHeightmapProfile, drawHeightmapPoints } from './components/heightmap.js';
import { drawIterationSlider } from './components/iterationSlider.js';
import { drawConeStepping, drawLastSteppingState } from './components/coneStepping.js';
import { drawHoveredCone, drawNextStepPoint, drawRay, clipLineToBox } from './components/shapes.js';

export function drawHeightmapVisualization() {
	if (state.heightmap.length === 0) {
		fill(150);
		textAlign(CENTER, CENTER);
		text("Generate a heightmap to start", params.canvasWidth / 2 - params.uiPanelWidth, params.canvasHeight / 2);
		return;
	}

	const viewHeight = params.canvasHeight - 2 * params.sideViewPadding;
	const viewWidth = params.canvasWidth - params.uiPanelWidth - 2 * params.sideViewPadding;
	const pointSpacing = viewWidth / (state.heightmap.length - 1);

	// Draw background for visualization area
	fill(255);
	stroke(200);
	strokeWeight(1);
	rect(params.sideViewPadding, params.sideViewPadding, viewWidth, viewHeight);

	// Draw iteration slider at top
	drawIterationSlider();

	// Draw heightmap profile (side view)
	drawHeightmapProfile(pointSpacing, viewHeight);

	// Draw height field points at bottom with color corresponding to height
	drawHeightmapPoints(pointSpacing, viewHeight);

	// Update hovered index based on closest x-wise point in entire visualization
	updateHoveredIndexFromMouse(pointSpacing, viewHeight, viewWidth);

	// Draw ray if enabled
	if (state.uiState.showRay) {
		drawRay(params.sideViewPadding, params.sideViewPadding, viewWidth, viewHeight);
		// Draw ray stepping visualization if enabled
		if (state.uiState.showConeStepping) {
			// Show current stepping when running, or last stepping when paused
			if (state.steppingRunning) {
				drawConeStepping(viewWidth, viewHeight);
			} else {
				drawLastSteppingState(viewWidth, viewHeight);
			}
		}
	}

	// Draw cone visualization (always show hovered cone if hovering)
	if (state.coneMap.length > 0 && state.hoveredIndex >= 0 && state.uiState.showHoveredCone) {
		drawHoveredCone(pointSpacing, viewHeight, viewWidth);

		// Only show next step point if ray is also visible
		if (state.uiState.showRay) {
			const scaleFactor = params.heightmapScale / 100;
			const heightAndCone = getHeightAndCone(state.hoveredX, pointSpacing, viewHeight, scaleFactor);
			
			if (heightAndCone) {
				const coneX = state.hoveredX;
				const coneY = heightAndCone.heightCanvas;
				const slopes = heightAndCone.cone.getScreenSlopes(pointSpacing, viewHeight);
				const pixelLeftSlope = slopes.pixelLeftSlope;
				const pixelRightSlope = slopes.pixelRightSlope;
				
				// Create ray and compute next step point
				const ray = new Ray(state.ray.x1, state.ray.y1, state.ray.x2, state.ray.y2);
				const nextStepPoint = ray.computeRayStep(coneX, coneY, pixelLeftSlope, pixelRightSlope, viewHeight);
				
				if (nextStepPoint) {
					drawNextStepPoint(nextStepPoint);
				}
			}
		}
	}

	function updateHoveredIndexFromMouse(pointSpacing, viewHeight, viewWidth) {
		// Account for the UI panel offset (already translated, so relative to visualization area)
		const adjustedMouseX = mouseX - params.uiPanelWidth;

		// Find closest point x-wise within the visualization area
		const minX = params.sideViewPadding;
		const maxX = params.sideViewPadding + viewWidth;

		state.hoveredIndex = -1;
		state.hoveredX = -1;
		let closestDist = Infinity;

		for (let i = 0; i < state.heightmap.length; i++) {
			const ptX = params.sideViewPadding + i * pointSpacing;
			const dist = Math.abs(adjustedMouseX - ptX);

			if (dist < closestDist && adjustedMouseX >= minX && adjustedMouseX <= maxX) {
				closestDist = dist;
				state.hoveredIndex = i;
				state.hoveredX = adjustedMouseX; // Store actual hovered x position
			}
		}
	}
}