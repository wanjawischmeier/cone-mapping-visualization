import { params } from '../../config.js';
import { state } from '../../state.js';
import { colors } from '../../config.js';
import { clipLineToBox } from './shapes.js';

export function drawTumblingWindows(pointSpacing, viewHeight) {
	if (!state.uiState.showTumblingWindows) {
		return;
	}
	if (!state.steppingData || !state.steppingData.stepPoints.length) {
		return;
	}

	const stepPoints = state.steppingData.stepPoints;
	const windowSize = state.tumblingWindowSize;
	const windowCount = state.tumblingWindowCount;
	const windowMaxIndices = state.steppingData.windowMaxIndices || Array(windowCount).fill(-1);
	const tumblingWindowMaxima = state.steppingData.tumblingWindowMaxima || Array(windowCount).fill(null);
	const globalMaxDistanceIndex = state.steppingData.globalMaxDistanceIndex || -1;
	const globalMaxDistance = state.steppingData.globalMaxDistance || 0;
	
	// Calculate the all-together maximum (max across all windows, or global max if no window maxima)
	let allTogetherMaxValue = null;
	for (let w = 0; w < windowCount; w++) {
		if (tumblingWindowMaxima[w] !== null) {
			if (allTogetherMaxValue === null || tumblingWindowMaxima[w] > allTogetherMaxValue) {
				allTogetherMaxValue = tumblingWindowMaxima[w];
			}
		}
	}
	// Fall back to global max if no window maxima found
	if (allTogetherMaxValue === null && globalMaxDistance > 0) {
		allTogetherMaxValue = globalMaxDistance;
	}
	
	let lastValidIndex = stepPoints.length - 1;
	if (state.steppingData.t_save_point) {
		// Find which step index corresponds to t_save_point
		for (let i = 0; i < stepPoints.length; i++) {
			if (stepPoints[i].x === state.steppingData.t_save_point.x && 
				stepPoints[i].y === state.steppingData.t_save_point.y) {
				lastValidIndex = i;
				break;
			}
		}
	}
	
	// Drawing parameters
	const baseY = params.sideViewPadding + viewHeight - 30; // Bottom of the height field area
	const lineHeight = 15; // Height between each window line
	
	// Calculate viewport bounds for cone clipping
	const boxMinX = params.sideViewPadding;
	const boxMinY = params.sideViewPadding;
	const boxMaxX = params.sideViewPadding + (params.canvasWidth - params.uiPanelWidth - 2 * params.sideViewPadding);
	const boxMaxY = params.sideViewPadding + viewHeight;
	
	// Draw each tumbling window
	for (let n = 0; n < windowCount; n++) {
		// Calculate the current window phase for this window
		// Each window is offset by (windowSize / windowCount) * n
		const windowOffset = (windowSize / windowCount) * n;
		
		// Determine which "phase" of the window we're in based on total steps
		const totalSteps = stepPoints.length - 1; // Exclude the origin point
		const currentPhase = Math.floor((totalSteps - windowOffset) / windowSize);
		
		// Calculate start index for this phase
		const windowStartStep = Math.floor(currentPhase * windowSize + windowOffset);
		const windowStartIdx = windowStartStep + 1; // +1 to account for index 0 being the origin
		const windowEndIdx = Math.min(windowStartIdx + windowSize - 1, lastValidIndex);
		
		// Only draw if we have valid points in this window
		if (windowStartIdx >= 1 && windowStartIdx <= lastValidIndex && windowStartIdx < stepPoints.length) {
			// Ensure end index is valid
			const actualEndIdx = Math.min(windowEndIdx, lastValidIndex);
			
			// Make sure we have valid points at both indices
			if (actualEndIdx < stepPoints.length && stepPoints[windowStartIdx] && stepPoints[actualEndIdx]) {
				const startPt = stepPoints[windowStartIdx];
				const endPt = stepPoints[actualEndIdx];
				
				// Draw line from start x to end x at this window's y position
				// Stack windows upwards from the bottom: window 0 at baseY, window 1 above it, etc
				const windowY = baseY - (n * lineHeight);
				
			stroke(...colors.tumblingWindowLine);
			strokeWeight(3); // Thicker line
			line(startPt.x, windowY, endPt.x, windowY);
			
			// Add markers at start and end
			fill(...colors.tumblingWindowMarker);
				circle(endPt.x, windowY, 6);
				
				// Mark the point with max distance in this window
				const windowMaxIdx = windowMaxIndices[n];
				if (windowMaxIdx >= windowStartIdx && windowMaxIdx <= actualEndIdx && windowMaxIdx >= 0 && stepPoints[windowMaxIdx]) {
					const maxPt = stepPoints[windowMaxIdx];
				// Draw a small light red circle on the line at the max point's x position
				fill(...colors.tumblingWindowMax);
					noStroke();
					circle(maxPt.x, windowY, 4);
				}
				
				// Mark the global max distance point specially
				if (globalMaxDistanceIndex >= windowStartIdx && globalMaxDistanceIndex <= actualEndIdx && globalMaxDistanceIndex >= 0 && stepPoints[globalMaxDistanceIndex]) {
					const globalMaxPt = stepPoints[globalMaxDistanceIndex];
					// Draw a larger circle with a cross at the global max position
				fill(...colors.tumblingGlobalMax);
				noStroke();
				circle(globalMaxPt.x, windowY, 8);
				// Draw a cross in the center
				stroke(...colors.tumblingGlobalMaxStroke);
					strokeWeight(2);
					line(globalMaxPt.x - 4, windowY, globalMaxPt.x + 4, windowY);
					line(globalMaxPt.x, windowY - 4, globalMaxPt.x, windowY + 4);
				}
				
				// Mark the all-together maximum point (max across all windows)
				// Draw it in any window where it appears
				if (allTogetherMaxValue !== null && globalMaxDistanceIndex >= windowStartIdx && globalMaxDistanceIndex <= actualEndIdx) {
					if (stepPoints[globalMaxDistanceIndex] && stepPoints[globalMaxDistanceIndex].distanceToRayOrigin) {
						// Check if this is actually the all-together max point
						if (Math.abs(stepPoints[globalMaxDistanceIndex].distanceToRayOrigin - allTogetherMaxValue) < 0.0001) {
							const allTogetherMaxPt = stepPoints[globalMaxDistanceIndex];
							// Draw a thick yellow outline circle around this point
							noFill();
							stroke(...colors.tumblingAllTogetherMax);
							strokeWeight(3);
							circle(allTogetherMaxPt.x, windowY, 12);
							
							// Draw the cone of the all-together max point
							if (allTogetherMaxPt.cone) {
								drawConeAtPosition(allTogetherMaxPt.x, allTogetherMaxPt.cone, pointSpacing, viewHeight, colors.tumblingAllTogetherMaxCone, boxMinX, boxMinY, boxMaxX, boxMaxY);
							}
						}
					}
				}
			}
		}
	}
}

// Helper function to draw a cone at a specific position
function drawConeAtPosition(coneX, cone, pointSpacing, viewHeight, color, boxMinX, boxMinY, boxMaxX, boxMaxY) {
	const coneHeightY = cone.getScreenPosition(pointSpacing, viewHeight, params.sideViewPadding).y;
	const { pixelLeftSlope, pixelRightSlope } = cone.getScreenSlopes(pointSpacing, viewHeight);

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
}
