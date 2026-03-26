import { params } from './config.js';
import { state } from './state.js';
import { Ray } from './ray.js';

// Performs cone stepping along the ray and returns step data
export function performConeStepping() {
    // Only run if stepping is enabled
    if (!shouldPerformStepping()) {
        return;
    }

    const viewWidth = params.canvasWidth - params.uiPanelWidth - 2 * params.sideViewPadding;
    const pointSpacing = viewWidth / (state.heightmap.length - 1);
    const viewHeight_canvas = params.canvasHeight - 2 * params.sideViewPadding;
    const scaleFactor = params.heightmapScale / 100;

    // Perform stepping iterations
    const stepPoints = [{ x: state.ray.x1, y: state.ray.y1, coneIndex: -1 }];
    let currentX = state.ray.x1;
    let currentY = state.ray.y1;
    let lastUsedIndex = -1;

    for (let step = 0; step < state.currentIteration; step++) {
        const result = performSteppingIteration(
            currentX,
            currentY,
            lastUsedIndex,
            pointSpacing,
            viewHeight_canvas,
            scaleFactor
        );

        if (!result) {
            break; // No valid intersection found
        }

        currentX = result.x;
        currentY = result.y;
        lastUsedIndex = result.coneIndex;
        stepPoints.push({ x: currentX, y: currentY, coneIndex: result.coneIndex });
    }

    // Find the cone index at the final position
    const currentConeIndex = findCurrentConeIndex(currentX, pointSpacing);

    // Store stepping data in state
    state.steppingData = {
        stepPoints,
        currentConeIndex,
        pointSpacing
    };
}

// Check if stepping should run
function shouldPerformStepping() {
    return state.steppingRunning && state.heightmap.length && state.coneMap.length;
}

// Find the closest heightmap point to a given x position, optionally excluding an index
function findClosestHeightmapIndex(xPos, pointSpacing, excludeIndex = -1) {
    let closestIndex = 0;
    let closestDist = Infinity;

    for (let i = 0; i < state.heightmap.length; i++) {
        if (i === excludeIndex) continue;

        const ptX = params.sideViewPadding + i * pointSpacing;
        const dist = Math.abs(xPos - ptX);
        if (dist < closestDist) {
            closestDist = dist;
            closestIndex = i;
        }
    }

    // If all points except excludeIndex were skipped, use excludeIndex's neighbor
    if (closestIndex === excludeIndex) {
        if (excludeIndex > 0) closestIndex = excludeIndex - 1;
        else closestIndex = excludeIndex + 1;
    }

    return closestIndex;
}

// Perform a single stepping iteration
function performSteppingIteration(currentX, currentY, lastUsedIndex, pointSpacing, viewHeight_canvas, scaleFactor) {
    // Find closest heightmap point (but different from last used index)
    const closestIndex = findClosestHeightmapIndex(currentX, pointSpacing, lastUsedIndex);

    // Get cone at this point
    const cone = state.coneMap[closestIndex];
    const coneX = params.sideViewPadding + closestIndex * pointSpacing;
    const coneHeightY = params.sideViewPadding + viewHeight_canvas - state.heightmap[closestIndex] * scaleFactor * viewHeight_canvas;

    // Calculate intersection point along the ray
    const intersection = calculateIntersectionAlongRay(
        currentX,
        currentY,
        cone,
        pointSpacing,
        viewHeight_canvas
    );

    if (!intersection) {
        return null; // No valid intersection
    }

    return {
        x: intersection.x,
        y: intersection.y,
        coneIndex: closestIndex
    };
}

// Calculate ray-cone intersection point
function calculateIntersectionAlongRay(currentX, currentY, cone, pointSpacing, viewHeight_canvas) {
    // Get ray direction
    const rayDx = state.ray.x2 - state.ray.x1;
    const rayDy = state.ray.y2 - state.ray.y1;
    const rayLen = Math.sqrt(rayDx * rayDx + rayDy * rayDy);
    const rayUx = rayLen > 0 ? rayDx / rayLen : 0;
    const rayUy = rayLen > 0 ? rayDy / rayLen : 0;

    // Create an artificial end point far away along the ray direction
    const infiniteRayX2 = currentX + rayUx * 10000;
    const infiniteRayY2 = currentY + rayUy * 10000;

    const stepRay = new Ray(currentX, currentY, infiniteRayX2, infiniteRayY2);
    const intersections = stepRay.getIntersectionsWithCone(cone, pointSpacing, viewHeight_canvas, params.sideViewPadding);

    // Find the closest intersection point ahead on the ray in the ray direction
    let closestIntersection = null;
    let minDot = Infinity;

    for (let intersection of intersections) {
        const dx = intersection.x - currentX;
        const dy = intersection.y - currentY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0.1) { // Avoid stepping to same point
            // Check if intersection is in ray direction
            const dotProduct = (dx * rayUx + dy * rayUy);
            if (dotProduct > 0.1 && dotProduct < minDot) { // Must be forward and closest in ray direction
                minDot = dotProduct;
                closestIntersection = intersection;
            }
        }
    }

    return closestIntersection;
}

// Find the cone index at the current position
function findCurrentConeIndex(currentX, pointSpacing) {
    if (state.steppingData.stepPoints.length <= 1) {
        return -1;
    }

    return findClosestHeightmapIndex(currentX, pointSpacing);
}
