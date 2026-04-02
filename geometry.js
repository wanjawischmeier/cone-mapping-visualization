// Geometric helper functions for ray-cone intersection and distance calculations

// Helper: Calculate closest point on a cone edge to a point
// edge is defined by a start point (apexX, apexY) and a direction (dx, dy)
// Returns {x, y} of the closest point on the edge
function getClosestPointOnEdge(apexX, apexY, edgeDx, edgeDy, pointX, pointY, maxDistance) {
	const edgeLen = Math.sqrt(edgeDx * edgeDx + edgeDy * edgeDy);
	const ux = edgeDx / edgeLen;
	const uy = edgeDy / edgeLen;

	const toPointX = pointX - apexX;
	const toPointY = pointY - apexY;

	// Project point onto the edge direction
	const t = toPointX * ux + toPointY * uy;
	// Clamp t to valid range [0, maxDistance]
	const tClamped = Math.max(0, Math.min(t, maxDistance));

	return {
		x: apexX + tClamped * ux,
		y: apexY + tClamped * uy
	};
}

// Compute the closest point on a cone to a given point
// Returns {distance: number, point: {x, y}}
export function getClosestPointOnCone(coneX, coneY, pixelLeftSlope, pixelRightSlope, pointX, pointY, viewHeight) {
	// Check apex as a candidate
	let minDist = Math.hypot(pointX - coneX, pointY - coneY);
	let closestPoint = { x: coneX, y: coneY };

	// Check left edge: parameterized as (coneX - t, coneY - pixelLeftSlope * t) for t >= 0
	const leftPoint = getClosestPointOnEdge(coneX, coneY, -1, -pixelLeftSlope, pointX, pointY, viewHeight * 2);
	const distLeft = Math.hypot(pointX - leftPoint.x, pointY - leftPoint.y);

	if (distLeft < minDist) {
		minDist = distLeft;
		closestPoint = leftPoint;
	}

	// Check right edge: similar to left
	const rightPoint = getClosestPointOnEdge(coneX, coneY, 1, -pixelRightSlope, pointX, pointY, viewHeight * 2);
	const distRight = Math.hypot(pointX - rightPoint.x, pointY - rightPoint.y);

	if (distRight < minDist) {
		minDist = distRight;
		closestPoint = rightPoint;
	}

	return { distance: minDist, point: closestPoint };
}
