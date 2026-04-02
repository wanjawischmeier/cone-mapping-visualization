import { params } from '../../config.js';
import { state } from '../../state.js';
import { colors } from '../../config.js';
import { clipLineToBox, drawDottedLine } from './shapes.js';

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
	for (let i = 1; i < stepPoints.length; i++) {
		const pt = stepPoints[i];
		// Only draw if within bounds
		if (pt.x >= boxMinX && pt.x <= boxMaxX && pt.y >= boxMinY && pt.y <= boxMaxY) {
			const stepColor = colors.coneStepPoint; // Blue for all points
			const baseRadius = 8; // Fixed base radius
			
			if (pt.distanceToRayOrigin !== undefined && pt.distanceToRayOrigin !== null) {
				// Ray origin is inside this cone - show two circles
				// Outer circle scaled by distance at reduced opacity
				const scaledRadius = baseRadius + Math.max(2, Math.min(12, pt.distanceToRayOrigin / 20));
				fill(...stepColor.slice(0, 3), 100); // Reduced opacity for outer circle
				noStroke();
				circle(pt.x, pt.y, scaledRadius * 2);
				
				// Inner circle with fixed radius at full opacity
				fill(...stepColor.slice(0, 3), 255);
				noStroke();
				circle(pt.x, pt.y, baseRadius);
			} else {
				// Ray origin is outside this cone - show single circle with low opacity
				fill(...stepColor.slice(0, 3), 100);
				noStroke();
				circle(pt.x, pt.y, baseRadius);
			}
		}
	}

	// Draw t_save point (last known safe position) in green with its cone
	if (state.steppingData.t_save_point) {
		const pt = state.steppingData.t_save_point;
		if (pt.x >= boxMinX && pt.x <= boxMaxX && pt.y >= boxMinY && pt.y <= boxMaxY) {
			fill(...colors.coneSavePoint);
			noStroke();
			circle(pt.x, pt.y, 10);
			
			// Draw cone at t_save position
			if (pt.cone) {
				const coneHeightY = pt.cone.getScreenPosition(pointSpacing, viewHeight_canvas, params.sideViewPadding).y;
				drawDottedLine(pt.x, pt.y, pt.x, coneHeightY, colors.coneSavePointAlpha75);
				drawConeAtPosition(pt.x, pt.cone, pointSpacing, viewHeight_canvas, colors.coneSavePointAlpha75, boxMinX, boxMinY, boxMaxX, boxMaxY);
			}
		}
	}

	// Draw t_fail point (first failure position) in red with its cone
	if (state.steppingData.t_fail_point) {
		const pt = state.steppingData.t_fail_point;
		if (pt.x >= boxMinX && pt.x <= boxMaxX && pt.y >= boxMinY && pt.y <= boxMaxY) {
			fill(...colors.coneFailPoint);
			noStroke();
			circle(pt.x, pt.y, 10);
			
			// Draw cone at t_fail position
			if (pt.cone) {
				const coneHeightY = pt.cone.getScreenPosition(pointSpacing, viewHeight_canvas, params.sideViewPadding).y;
				drawDottedLine(pt.x, pt.y, pt.x, coneHeightY, colors.coneFailPointAlpha75);
				drawConeAtPosition(pt.x, pt.cone, pointSpacing, viewHeight_canvas, colors.coneFailPointAlpha75, boxMinX, boxMinY, boxMaxX, boxMaxY);
			}
		}
	}

	// Draw cone at current iteration
	if (state.currentIteration > 0 && state.currentIteration < stepPoints.length) {
		const currentPt = stepPoints[state.currentIteration];
		if (currentPt.cone) {
			const coneHeightY = currentPt.cone.getScreenPosition(pointSpacing, viewHeight_canvas, params.sideViewPadding).y;
			drawDottedLine(currentPt.x, currentPt.y, currentPt.x, coneHeightY, colors.coneCurrentPointAlpha75);
			drawConeAtPosition(currentPt.x, currentPt.cone, pointSpacing, viewHeight_canvas, colors.coneCurrentPointAlpha75, boxMinX, boxMinY, boxMaxX, boxMaxY);
		}
	}

	// Draw cone at t_save (green with reduced opacity)
	if (state.steppingData.t_save_point && state.steppingData.t_save_point.cone) {
		drawConeAtPosition(state.steppingData.t_save_point.x, state.steppingData.t_save_point.cone, pointSpacing, viewHeight_canvas, colors.coneSavePointAlpha80, boxMinX, boxMinY, boxMaxX, boxMaxY);
	}

	// Draw cone at t_fail (red with reduced opacity)
	if (state.steppingData.t_fail_point && state.steppingData.t_fail_point.cone) {
		drawConeAtPosition(state.steppingData.t_fail_point.x, state.steppingData.t_fail_point.cone, pointSpacing, viewHeight_canvas, colors.coneFailPointAlpha80, boxMinX, boxMinY, boxMaxX, boxMaxY);
	}
}

// Helper function to draw a cone at a specific position
function drawConeAtPosition(coneX, cone, pointSpacing, viewHeight_canvas, color, boxMinX, boxMinY, boxMaxX, boxMaxY) {
	const coneHeightY = cone.getScreenPosition(pointSpacing, viewHeight_canvas, params.sideViewPadding).y;
	const { pixelLeftSlope, pixelRightSlope } = cone.getScreenSlopes(pointSpacing, viewHeight_canvas);

	// Draw left cone edge
	const leftEdge = clipLineToBox(coneX, coneHeightY, -1, -pixelLeftSlope, boxMinX, boxMinY, boxMaxX, boxMaxY);
	if (leftEdge) {
		stroke(...color);
		strokeWeight(2);
		line(leftEdge.startX, leftEdge.startY, leftEdge.endX, leftEdge.endY);
	}

	// Draw right cone edge
	const rightEdge = clipLineToBox(coneX, coneHeightY, 1, -pixelRightSlope, boxMinX, boxMinY, boxMaxX, boxMaxY);
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
	if (state.lastSteppingData.t_save_point && state.lastSteppingData.t_save_point.cone) {
		drawConeAtPosition(state.lastSteppingData.t_save_point.x, state.lastSteppingData.t_save_point.cone, pointSpacing, viewHeight_canvas, [100, 255, 100, 50], boxMinX, boxMinY, boxMaxX, boxMaxY);
	}

	// Draw cone at t_fail (red with reduced opacity)
	if (state.lastSteppingData.t_fail_point && state.lastSteppingData.t_fail_point.cone) {
		drawConeAtPosition(state.lastSteppingData.t_fail_point.x, state.lastSteppingData.t_fail_point.cone, pointSpacing, viewHeight_canvas, [255, 100, 100, 50], boxMinX, boxMinY, boxMaxX, boxMaxY);
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
