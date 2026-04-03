import { params } from "./config.js";
import { state } from "./state.js";
import { Ray } from "./ray.js";
import { getHeightAndCone } from "./helpers/sampling.js";
import { getClosestPointOnCone } from "./helpers/geometry.js";

// Perform binary search between t_save and t_fail to find exact surface intersection
export function performBinarySearch() {
	if (!state.steppingData || !state.steppingData.t_save_point || !state.steppingData.t_fail_point) {
		return null;
	}

	const viewWidth = params.canvasWidth - params.uiPanelWidth - 2 * params.sideViewPadding;
	const pointSpacing = state.steppingData.pointSpacing;
	const viewHeight_canvas = params.canvasHeight - 2 * params.sideViewPadding;
	const scaleFactor = params.heightmapScale / 100;

	const t_save = state.steppingData.t_save_point;
	const t_fail = state.steppingData.t_fail_point;

	// Initialize binary search bounds
	let lowerX = t_save.x;
	let lowerY = t_save.y;
	let upperX = t_fail.x;
	let upperY = t_fail.y;

	const binarySearchSteps = [];

	// Perform binary search iterations
	for (let step = 0; step < params.binarySearchSteps; step++) {
		// Calculate midpoint between lower and upper bounds
		const midX = (lowerX + upperX) / 2;
		const midY = (lowerY + upperY) / 2;

		// Store this step
		binarySearchSteps.push({ x: midX, y: midY });

		// Get cone and height at midpoint
		const surfaceData = getHeightAndCone(midX, pointSpacing, viewHeight_canvas, scaleFactor);
		const surfaceHeightCanvas = surfaceData.heightCanvas;

		// Check if ray at midpoint is above or below surface
		if (midY >= surfaceHeightCanvas) {
			// Midpoint is below surface (hit) - search upward (towards t_save)
			upperX = midX;
			upperY = midY;
		} else {
			// Midpoint is above surface (safe) - search downward (towards t_fail)
			lowerX = midX;
			lowerY = midY;
		}
	}

	// Final surface point is at the lower bound (last safe position)
	const finalSurfacePoint = {
		x: lowerX,
		y: lowerY,
	};

	return {
		binarySearchSteps,
		finalSurfacePoint,
	};
}
