import { params } from '../../config.js';
import { state } from '../../state.js';
import { Ray } from '../../ray.js';
import { getHeightAndCone } from '../../helpers/sampling.js';
import { getClosestPointOnCone } from '../../helpers/geometry.js';
import { drawHeightmapProfile, drawHeightmapPoints } from '../components/heightmap.js';
import { drawIterationSlider } from '../components/iterationSlider.js';
import { drawConeStepping, drawLastSteppingState } from '../components/coneStepping.js';
import { drawHoveredCone, drawNextStepPoint, drawRay, clipLineToBox, drawDottedLine } from '../components/shapes.js';
import { colors } from '../../config.js';

export function drawHeightmapVisualization() {
	if (state.heightmap.length === 0) {
		fill(colors.heightmapStepFill);
		textAlign(CENTER, CENTER);
		text("Generate a heightmap to start", params.canvasWidth / 2 - params.uiPanelWidth, params.canvasHeight / 2);
		return;
	}

	const viewHeight = params.canvasHeight - 2 * params.sideViewPadding;
	const viewWidth = params.canvasWidth - params.uiPanelWidth - 2 * params.sideViewPadding;
	const pointSpacing = viewWidth / (state.heightmap.length - 1);

	// Draw background for visualization area
	fill(colors.heightmapLinesFill);
	stroke(colors.heightmapLinesStroke);
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
		// Only show next step point if ray is also visible
		let rayOriginInsideCone = false;
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
					rayOriginInsideCone = true;

					drawNextStepPoint(nextStepPoint);

					// Draw dotted line from ray origin to the closest point on the cone
					const closestOnCone = getClosestPointOnCone(coneX, coneY, pixelLeftSlope, pixelRightSlope, state.ray.x1, state.ray.y1, viewHeight);
					drawDottedLine(state.ray.x1, state.ray.y1, closestOnCone.point.x, closestOnCone.point.y, [255, 165, 100, 200]);
				}

				// Compute intersection of vertical line at coneX with the ray
				const rayDx = state.ray.x2 - state.ray.x1;
				const rayDy = state.ray.y2 - state.ray.y1;
				const t = (coneX - state.ray.x1) / rayDx;
				if (t >= 0 && Math.abs(rayDx) > 1e-6) {
					const intersectionY = state.ray.y1 + t * rayDy;
					const opacity = rayOriginInsideCone ? 200 : 75;

					// Draw vertical dotted line from cone apex to the ray intersection point
					drawDottedLine(coneX, coneY, coneX, intersectionY, [255, 165, 100, opacity]);
				}
			}
		}

		drawHoveredCone(pointSpacing, viewHeight, viewWidth, rayOriginInsideCone);
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