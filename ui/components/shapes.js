import { params } from '../../config.js';
import { coneMap, state } from '../../state.js';
import { getHeightAndCone } from '../../helpers/sampling.js';

export function drawHoveredCone(pointSpacing, viewHeight, viewWidth, rayOriginInsideCone = true) {
	if (state.hoveredIndex < 0 || state.hoveredIndex >= coneMap.length) return;

	let x, y, pixelLeftSlope, pixelRightSlope;

	if (state.hoveredX >= 0) {
		// Use the same interpolation logic as stepping
		const scaleFactor = params.heightmapScale / 100;
		const heightAndCone = getHeightAndCone(state.hoveredX, pointSpacing, viewHeight, scaleFactor);
		
		if (heightAndCone) {
			x = state.hoveredX;
			y = heightAndCone.heightCanvas;
			
			// Use interpolated slopes if available, otherwise get from cone
			if (heightAndCone.pixelLeftSlope !== undefined && heightAndCone.pixelRightSlope !== undefined) {
				pixelLeftSlope = heightAndCone.pixelLeftSlope;
				pixelRightSlope = heightAndCone.pixelRightSlope;
			} else {
				const slopes = heightAndCone.cone.getScreenSlopes(pointSpacing, viewHeight);
				pixelLeftSlope = slopes.pixelLeftSlope;
				pixelRightSlope = slopes.pixelRightSlope;
			}
		} else {
			return; // Out of bounds
		}
	} else {
		// Use nearest cone
		const cone = coneMap[state.hoveredIndex];
		const pos = cone.getScreenPosition(pointSpacing, viewHeight, params.sideViewPadding);
		x = pos.x;
		y = pos.y;
		
		const slopes = cone.getScreenSlopes(pointSpacing, viewHeight);
		pixelLeftSlope = slopes.pixelLeftSlope;
		pixelRightSlope = slopes.pixelRightSlope;
	}

	// Visualization box bounds
	const boxMinX = params.sideViewPadding;
	const boxMinY = params.sideViewPadding;
	const boxMaxX = params.sideViewPadding + viewWidth;
	const boxMaxY = params.sideViewPadding + viewHeight;

	// Determine opacity based on whether ray origin is inside cone
	const opacity = rayOriginInsideCone ? 255 : 75;
	const coneColor = [255, 165, 100, opacity]; // Orange

	// Left cone edge: passes through apex with direction (-1, -leftSlopePixels)
	const leftEdge = clipLineToBox(x, y, -1, -pixelLeftSlope, boxMinX, boxMinY, boxMaxX, boxMaxY);
	if (leftEdge) {
		stroke(...coneColor);
		strokeWeight(2);
		line(leftEdge.startX, leftEdge.startY, leftEdge.endX, leftEdge.endY);
	}

	// Right cone edge: passes through apex with direction (1, -rightSlopePixels)
	const rightEdge = clipLineToBox(x, y, 1, -pixelRightSlope, boxMinX, boxMinY, boxMaxX, boxMaxY);
	if (rightEdge) {
		stroke(...coneColor);
		strokeWeight(2);
		line(rightEdge.startX, rightEdge.startY, rightEdge.endX, rightEdge.endY);
	}

	// Highlight the apex point
	fill(...coneColor);
	noStroke();
	circle(x, y, params.pointSize + 4);
}

export function drawRay(boxMinX, boxMinY, boxWidth, boxHeight) {
	// Visualization box bounds
	const boxMaxX = boxMinX + boxWidth;
	const boxMaxY = boxMinY + boxHeight;

	// Calculate ray direction
	const rayDx = state.ray.x2 - state.ray.x1;
	const rayDy = state.ray.y2 - state.ray.y1;

	// Clip ray to box
	const clipped = clipLineToBox(state.ray.x1, state.ray.y1, rayDx, rayDy, boxMinX, boxMinY, boxMaxX, boxMaxY);
	if (clipped) {
		stroke(100, 150, 255);
		strokeWeight(2);
		line(clipped.startX, clipped.startY, clipped.endX, clipped.endY);
	}

	// Draw grabbable endpoints (larger)
	fill(100, 150, 255);
	noStroke();
	circle(state.ray.x1, state.ray.y1, 16);
	circle(state.ray.x2, state.ray.y2, 16);
}

export function drawRayIntersections(viewWidth, viewHeight) {
	// This function has been removed - use drawNextStepPoint instead
}

export function drawNextStepPoint(stepPoint) {
	if (!stepPoint) return;

	// Draw the next step point that the ray would step to (orange for hovered cone)
	fill(255, 165, 100);
	noStroke();
	circle(stepPoint.x, stepPoint.y, 10);
}

// Helper: Draw a dotted line
export function drawDottedLine(x1, y1, x2, y2, color) {
	stroke(...color);
	strokeWeight(1);
	
	const dashLength = 5;
	const gapLength = 5;
	const dx = x2 - x1;
	const dy = y2 - y1;
	const distance = Math.hypot(dx, dy);
	const steps = Math.ceil(distance / (dashLength + gapLength));
	const ux = dx / distance;
	const uy = dy / distance;
	
	for (let i = 0; i < steps; i++) {
		const dashStart = i * (dashLength + gapLength);
		const dashEnd = dashStart + dashLength;
		const x1d = x1 + ux * dashStart;
		const y1d = y1 + uy * dashStart;
		const x2d = x1 + ux * Math.min(dashEnd, distance);
		const y2d = y1 + uy * Math.min(dashEnd, distance);
		line(x1d, y1d, x2d, y2d);
	}
}

// Helper: Clip a line defined by point and direction to a box
// Only extends in the positive direction (t >= 0)
// Returns {startX, startY, endX, endY} or null if line misses box
export function clipLineToBox(x0, y0, dx, dy, boxMinX, boxMinY, boxMaxX, boxMaxY) {
	const boxMaxX_val = boxMaxX;
	const boxMaxY_val = boxMaxY;

	const len = Math.sqrt(dx * dx + dy * dy);
	if (len === 0) return null;

	const ux = dx / len;
	const uy = dy / len;

	let minT = 0;  // Only extend forward
	let maxT = Infinity;

	// Clip to x bounds
	if (Math.abs(ux) > 1e-6) {
		let tLeft = (boxMinX - x0) / ux;
		let tRight = (boxMaxX_val - x0) / ux;
		let tMin = Math.min(tLeft, tRight);
		let tMax = Math.max(tLeft, tRight);
		minT = Math.max(minT, tMin);
		maxT = Math.min(maxT, tMax);
	} else {
		if (x0 < boxMinX || x0 > boxMaxX_val) return null;
	}

	// Clip to y bounds
	if (Math.abs(uy) > 1e-6) {
		let tTop = (boxMinY - y0) / uy;
		let tBottom = (boxMaxY_val - y0) / uy;
		let tMin = Math.min(tTop, tBottom);
		let tMax = Math.max(tTop, tBottom);
		minT = Math.max(minT, tMin);
		maxT = Math.min(maxT, tMax);
	} else {
		if (y0 < boxMinY || y0 > boxMaxY_val) return null;
	}

	if (minT < maxT) {
		return {
			startX: x0 + minT * ux,
			startY: y0 + minT * uy,
			endX: x0 + maxT * ux,
			endY: y0 + maxT * uy
		};
	}
	return null;
}