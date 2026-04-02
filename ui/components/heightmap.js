import { params } from '../../config.js';
import { state } from '../../state.js';
import { colors } from '../../config.js';

export function drawHeightmapProfile(pointSpacing, viewHeight) {
	stroke(colors.heightmapGrid);
	strokeWeight(params.lineWeight);
	noFill();

	if (state.uiState.heightmapInterpolated) {
		// Smooth interpolated mode
		beginShape();
		for (let i = 0; i < state.heightmap.length; i++) {
			const x = params.sideViewPadding + i * pointSpacing;
			const y = params.sideViewPadding + viewHeight - state.heightmap[i] * (params.heightmapScale / 100) * viewHeight;
			vertex(x, y);
		}
		endShape();
	} else {
		// Nearest neighbor (stepped) mode - step at midpoints between samples
		beginShape();
		for (let i = 0; i < state.heightmap.length; i++) {
			const x = params.sideViewPadding + i * pointSpacing;
			const y = params.sideViewPadding + viewHeight - state.heightmap[i] * (params.heightmapScale / 100) * viewHeight;
			
			if (i === 0) {
				vertex(x, y);
			} else {
				// Midpoint x between previous and current samples
				const prevX = params.sideViewPadding + (i - 1) * pointSpacing;
				const midX = (prevX + x) / 2;
				const prevY = params.sideViewPadding + viewHeight - state.heightmap[i - 1] * (params.heightmapScale / 100) * viewHeight;
				
				// Horizontal line to midpoint at previous height
				vertex(midX, prevY);
				// Vertical line to current height at midpoint
				vertex(midX, y);
				// Continue to next sample at current height
				vertex(x, y);
			}
		}
		endShape();
	}

	// Draw profile points
	fill(colors.heightmapGrid);
	noStroke();
	for (let i = 0; i < state.heightmap.length; i++) {
		const x = params.sideViewPadding + i * pointSpacing;
		const y = params.sideViewPadding + viewHeight - state.heightmap[i] * (params.heightmapScale / 100) * viewHeight;
		circle(x, y, params.pointSize);
	}
}

export function drawHeightmapPoints(pointSpacing, viewHeight) {
	const baseY = params.sideViewPadding + viewHeight + 40;

	for (let i = 0; i < state.heightmap.length; i++) {
		const x = params.sideViewPadding + i * pointSpacing;

		// Color based on scaled height (grayscale)
		const scaledHeight = state.heightmap[i] * (params.heightmapScale / 100);
		const colorValue = Math.min(scaledHeight, 1) * 255;
		fill(colorValue);
		stroke(colors.heightmapGrid);
		strokeWeight(1);

		circle(x, baseY, params.pointSize);
	}

	// Display height value as text when hovering over heightmap points
	if (state.hoveredIndex >= 0 && state.hoveredIndex < state.heightmap.length) {
		const hoveredX = params.sideViewPadding + state.hoveredIndex * pointSpacing;
		const scaledHeight = state.heightmap[state.hoveredIndex] * (params.heightmapScale / 100);

		// Display value above the circle
		fill(colors.heightmapGrid);
		noStroke();
		textSize(11);
		textAlign(CENTER, BOTTOM);
		text(scaledHeight.toFixed(3), hoveredX, baseY - params.pointSize - 5);
	}
}
