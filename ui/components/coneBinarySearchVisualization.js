import { params } from '../../config.js';
import { state } from '../../state.js';

export function drawBinarySearchVisualization(pointSpacing, viewHeight_canvas) {
	if (!state.uiState.showBinarySearch || !state.binarySearchData || !state.binarySearchData.binarySearchSteps) {
		return;
	}

	const binarySearchSteps = state.binarySearchData.binarySearchSteps;
	const finalSurfacePoint = state.binarySearchData.finalSurfacePoint;

	if (!binarySearchSteps.length) {
		return;
	}

	// Viewport bounds for drawing
	const boxMinX = params.sideViewPadding;
	const boxMinY = params.sideViewPadding;
	const boxMaxX = params.sideViewPadding + (params.canvasWidth - params.uiPanelWidth - 2 * params.sideViewPadding);
	const boxMaxY = params.sideViewPadding + viewHeight_canvas;

	// Draw all intermediate binary search steps
	for (let i = 0; i < binarySearchSteps.length; i++) {
		const pt = binarySearchSteps[i];

		if (pt.x >= boxMinX && pt.x <= boxMaxX && pt.y >= boxMinY && pt.y <= boxMaxY) {
			// Draw intermediate steps as small purple circles
			fill(200, 100, 200, 200); // Purple with some transparency
			noStroke();
			circle(pt.x, pt.y, 5);
		}
	}

	// Draw final surface point in a different color
	if (finalSurfacePoint && finalSurfacePoint.x >= boxMinX && finalSurfacePoint.x <= boxMaxX && finalSurfacePoint.y >= boxMinY && finalSurfacePoint.y <= boxMaxY) {
		// Draw final point as larger orange circle
		fill(255, 165, 100, 255); // Orange
		noStroke();
		circle(finalSurfacePoint.x, finalSurfacePoint.y, 8);
	}
}
