import { params } from '../../config.js';
import { state } from '../../state.js';
import { clipLineToBox } from './shapes.js';

export function drawConeStepping(viewWidth, viewHeight) {
	if (!state.steppingData || !state.steppingData.stepPoints.length) return;

	const viewHeight_canvas = params.canvasHeight - 2 * params.sideViewPadding;
	const scaleFactor = params.heightmapScale / 100;
	const pointSpacing = state.steppingData.pointSpacing;

	const boxMinX = params.sideViewPadding;
	const boxMinY = params.sideViewPadding;
	const boxMaxX = params.sideViewPadding + viewWidth;
	const boxMaxY = params.sideViewPadding + viewHeight_canvas;

	const stepPoints = state.steppingData.stepPoints;

	// Draw ALL step points (always show the full path)
	for (let i = 0; i < stepPoints.length; i++) {
		const pt = stepPoints[i];
		// Only draw if within bounds
		if (pt.x >= boxMinX && pt.x <= boxMaxX && pt.y >= boxMinY && pt.y <= boxMaxY) {
			const stepColor = [150, 150, 255]; // Blue for all points
			fill(...stepColor);
			noStroke();
			circle(pt.x, pt.y, 6);
		}
	}

	// Draw t_save point (last known safe position) in green
	if (state.steppingData.t_save_point) {
		const pt = state.steppingData.t_save_point;
		if (pt.x >= boxMinX && pt.x <= boxMaxX && pt.y >= boxMinY && pt.y <= boxMaxY) {
			fill(100, 255, 100);
			noStroke();
			circle(pt.x, pt.y, 10);
		}
	}

	// Draw t_fail point (first failure position) in red
	if (state.steppingData.t_fail_point) {
		const pt = state.steppingData.t_fail_point;
		if (pt.x >= boxMinX && pt.x <= boxMaxX && pt.y >= boxMinY && pt.y <= boxMaxY) {
			fill(255, 100, 100);
			noStroke();
			circle(pt.x, pt.y, 10);
		}
	}

	// Draw cone at current iteration
	if (state.currentIteration >= 0 && state.currentIteration < stepPoints.length) {
		const currentPt = stepPoints[state.currentIteration];
		const currentConeIndex = currentPt.coneIndex !== undefined ? currentPt.coneIndex : state.steppingData.currentConeIndex;

		if (currentConeIndex >= 0 && currentConeIndex < state.coneMap.length) {
			const cone = state.coneMap[currentConeIndex];
			if (cone && currentConeIndex < state.heightmap.length) {
				drawConeAt(currentConeIndex, cone, pointSpacing, viewHeight_canvas, scaleFactor, [200, 100, 200], boxMinX, boxMinY, boxMaxX, boxMaxY);
			}
		}
	}

	// Draw cone at t_save (green with reduced opacity)
	if (state.steppingData.t_save_point && state.steppingData.t_save_point.coneIndex !== undefined) {
		const coneIndex = state.steppingData.t_save_point.coneIndex;
		if (coneIndex >= 0 && coneIndex < state.coneMap.length) {
			const cone = state.coneMap[coneIndex];
			if (cone && coneIndex < state.heightmap.length) {
				drawConeAt(coneIndex, cone, pointSpacing, viewHeight_canvas, scaleFactor, [100, 255, 100, 80], boxMinX, boxMinY, boxMaxX, boxMaxY);
			}
		}
	}

	// Draw cone at t_fail (red with reduced opacity)
	if (state.steppingData.t_fail_point && state.steppingData.t_fail_point.coneIndex !== undefined) {
		const coneIndex = state.steppingData.t_fail_point.coneIndex;
		if (coneIndex >= 0 && coneIndex < state.coneMap.length) {
			const cone = state.coneMap[coneIndex];
			if (cone && coneIndex < state.heightmap.length) {
				drawConeAt(coneIndex, cone, pointSpacing, viewHeight_canvas, scaleFactor, [255, 100, 100, 80], boxMinX, boxMinY, boxMaxX, boxMaxY);
			}
		}
	}
}

// Helper function to draw a cone at a specific index
function drawConeAt(coneIndex, cone, pointSpacing, viewHeight_canvas, scaleFactor, color, boxMinX, boxMinY, boxMaxX, boxMaxY) {
	const coneX = params.sideViewPadding + coneIndex * pointSpacing;
	const coneHeightY = params.sideViewPadding + viewHeight_canvas - state.heightmap[coneIndex] * scaleFactor * viewHeight_canvas;

	const effectiveViewHeight = viewHeight_canvas * scaleFactor;
	const leftSlopePixels = Math.tan(cone.leftAngle) * (effectiveViewHeight / pointSpacing);
	const rightSlopePixels = Math.tan(cone.rightAngle) * (effectiveViewHeight / pointSpacing);

	// Draw left cone edge
	const leftEdge = clipLineToBox(coneX, coneHeightY, -1, -leftSlopePixels, boxMinX, boxMinY, boxMaxX, boxMaxY);
	if (leftEdge) {
		stroke(...color);
		strokeWeight(2);
		line(leftEdge.startX, leftEdge.startY, leftEdge.endX, leftEdge.endY);
	}

	// Draw right cone edge
	const rightEdge = clipLineToBox(coneX, coneHeightY, 1, -rightSlopePixels, boxMinX, boxMinY, boxMaxX, boxMaxY);
	if (rightEdge) {
		stroke(...color);
		strokeWeight(2);
		line(rightEdge.startX, rightEdge.startY, rightEdge.endX, rightEdge.endY);
	}

	// Apex point
	fill(...color);
	noStroke();
	circle(coneX, coneHeightY, 6);
}


// Draw the last stepped state with low opacity (shown when paused)
export function drawLastSteppingState(viewWidth, viewHeight) {
	// Only show when stepping is paused
	if (state.steppingRunning || !state.lastSteppingData || !state.lastSteppingData.stepPoints.length) return;

	const viewHeight_canvas = params.canvasHeight - 2 * params.sideViewPadding;
	const scaleFactor = params.heightmapScale / 100;
	const pointSpacing = state.lastSteppingData.pointSpacing;
	const opacity = 100; // Out of 255

	const boxMinX = params.sideViewPadding;
	const boxMinY = params.sideViewPadding;
	const boxMaxX = params.sideViewPadding + viewWidth;
	const boxMaxY = params.sideViewPadding + viewHeight_canvas;

	const stepPoints = state.lastSteppingData.stepPoints;

	// Draw ALL step points with low opacity
	for (let i = 0; i < stepPoints.length; i++) {
		const pt = stepPoints[i];
		// Only draw if within bounds
		if (pt.x >= boxMinX && pt.x <= boxMaxX && pt.y >= boxMinY && pt.y <= boxMaxY) {
			const stepColor = [150, 150, 255]; // Blue for all points
			fill(...stepColor, opacity);
			noStroke();
			circle(pt.x, pt.y, 6);
		}
	}

	// Draw t_save point (last known safe position) in green with opacity
	if (state.lastSteppingData.t_save_point) {
		const pt = state.lastSteppingData.t_save_point;
		if (pt.x >= boxMinX && pt.x <= boxMaxX && pt.y >= boxMinY && pt.y <= boxMaxY) {
			fill(100, 255, 100, opacity);
			noStroke();
			circle(pt.x, pt.y, 10);
		}
	}

	// Draw t_fail point (first failure position) in red with opacity
	if (state.lastSteppingData.t_fail_point) {
		const pt = state.lastSteppingData.t_fail_point;
		if (pt.x >= boxMinX && pt.x <= boxMaxX && pt.y >= boxMinY && pt.y <= boxMaxY) {
			fill(255, 100, 100, opacity);
			noStroke();
			circle(pt.x, pt.y, 10);
		}
	}

	// Draw cone at t_save (green with reduced opacity)
	if (state.lastSteppingData.t_save_point && state.lastSteppingData.t_save_point.coneIndex !== undefined) {
		const coneIndex = state.lastSteppingData.t_save_point.coneIndex;
		if (coneIndex >= 0 && coneIndex < state.coneMap.length) {
			const cone = state.coneMap[coneIndex];
			if (cone && coneIndex < state.heightmap.length) {
				drawConeAt(coneIndex, cone, pointSpacing, viewHeight_canvas, scaleFactor, [100, 255, 100, 50], boxMinX, boxMinY, boxMaxX, boxMaxY);
			}
		}
	}

	// Draw cone at t_fail (red with reduced opacity)
	if (state.lastSteppingData.t_fail_point && state.lastSteppingData.t_fail_point.coneIndex !== undefined) {
		const coneIndex = state.lastSteppingData.t_fail_point.coneIndex;
		if (coneIndex >= 0 && coneIndex < state.coneMap.length) {
			const cone = state.coneMap[coneIndex];
			if (cone && coneIndex < state.heightmap.length) {
				drawConeAt(coneIndex, cone, pointSpacing, viewHeight_canvas, scaleFactor, [255, 100, 100, 50], boxMinX, boxMinY, boxMaxX, boxMaxY);
			}
		}
	}

	// Draw the old ray with low opacity
	if (state.lastRay) {
		const rayDx = state.lastRay.x2 - state.lastRay.x1;
		const rayDy = state.lastRay.y2 - state.lastRay.y1;

		// Clip ray to box
		const clipped = clipLineToBox(state.lastRay.x1, state.lastRay.y1, rayDx, rayDy, boxMinX, boxMinY, boxMaxX, boxMaxY);
		if (clipped) {
			stroke(100, 150, 255, opacity);
			strokeWeight(2);
			line(clipped.startX, clipped.startY, clipped.endX, clipped.endY);
		}
	}
}
