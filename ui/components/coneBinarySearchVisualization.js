import { params } from '../../config.js';
import { state } from '../../state.js';

export function drawBinarySearchVisualization(pointSpacing, viewHeight_canvas) {
	if (!state.uiState.showBinarySearch || !state.binarySearchData || !state.binarySearchData.binarySearchSteps) {
		return;
	}

	const binarySearchSteps = state.binarySearchData.binarySearchSteps;
	const finalSurfacePoint = state.binarySearchData.finalSurfacePoint;
	const globalMaxDistanceIndex = state.binarySearchData.globalMaxDistanceIndex || -1;

	if (!binarySearchSteps.length) {
		return;
	}

	// Viewport bounds for drawing
	const boxMinX = params.sideViewPadding;
	const boxMinY = params.sideViewPadding;
	const boxMaxX = params.sideViewPadding + (params.canvasWidth - params.uiPanelWidth - 2 * params.sideViewPadding);
	const boxMaxY = params.sideViewPadding + viewHeight_canvas;

	const baseRadius = 8; // Fixed base radius for inner circle

	// Draw all intermediate binary search steps with distance circles
	for (let i = 0; i < binarySearchSteps.length; i++) {
		const pt = binarySearchSteps[i];

		if (pt.x >= boxMinX && pt.x <= boxMaxX && pt.y >= boxMinY && pt.y <= boxMaxY) {
			// Determine colors
			const stepColor = [200, 100, 200]; // Purple for binary search steps
			
			if (pt.distanceToRayOrigin !== undefined && pt.distanceToRayOrigin !== null && state.uiState.showTumblingWindows) {
				// Ray origin is inside this cone - show two circles just like cone stepping (only if tumbling windows on)
				// Outer circle scaled by distance at reduced opacity
				const scaledRadius = baseRadius + Math.max(2, Math.min(12, pt.distanceToRayOrigin / 20));
				fill(...stepColor, 100); // Reduced opacity for outer circle
				noStroke();
				circle(pt.x, pt.y, scaledRadius * 2);
				
				// Inner circle with fixed radius at full opacity
				fill(...stepColor, 255);
				noStroke();
				circle(pt.x, pt.y, baseRadius);
			} else {
				// Ray origin is outside this cone or tumbling windows off - show single circle with full opacity
				const opacity = state.uiState.showTumblingWindows ? 100 : 255;
				fill(...stepColor, opacity);
				noStroke();
				circle(pt.x, pt.y, baseRadius);
			}
		}
	}

	// Highlight the global max distance point in binary search (only if tumbling windows on)
	if (state.uiState.showTumblingWindows && globalMaxDistanceIndex >= 0 && globalMaxDistanceIndex < binarySearchSteps.length) {
		const globalMaxPt = binarySearchSteps[globalMaxDistanceIndex];
		if (globalMaxPt && globalMaxPt.x >= boxMinX && globalMaxPt.x <= boxMaxX && globalMaxPt.y >= boxMinY && globalMaxPt.y <= boxMaxY) {
			// Draw a small bright dot in the center
			fill(255, 0, 0, 255);
			noStroke();
			circle(globalMaxPt.x, globalMaxPt.y, 4);
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
