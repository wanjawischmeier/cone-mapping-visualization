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

    // Perform stepping iterations with proper termination
    const steppingResult = performSteppingWithTermination(
        state.ray.x1,
        state.ray.y1,
        pointSpacing,
        viewHeight_canvas,
        scaleFactor
    );

    // Store stepping data in state
    state.steppingData = {
        stepPoints: steppingResult.stepPoints,
        currentConeIndex: steppingResult.currentConeIndex,
        pointSpacing,
        t_save_point: steppingResult.t_save_point,
        t_fail_point: steppingResult.t_fail_point,
        has_hit: steppingResult.has_hit,
        maxIterationsTaken: steppingResult.stepPoints.length - 1  // Number of actual steps taken
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

// Perform stepping with proper termination at first surface hit
function performSteppingWithTermination(rayX1, rayY1, pointSpacing, viewHeight_canvas, scaleFactor) {
    const stepPoints = [{ x: rayX1, y: rayY1, coneIndex: -1 }];
    
    let currentX = rayX1;
    let currentY = rayY1;
    let t_save_point = { x: rayX1, y: rayY1, coneIndex: -1 }; // Start is always safe
    let t_fail_point = null;
    let has_hit = false;

    const rayDx = state.ray.x2 - state.ray.x1;
    const rayDy = state.ray.y2 - state.ray.y1;
    const rayLen = Math.sqrt(rayDx * rayDx + rayDy * rayDy);
    const rayUx = rayLen > 0 ? rayDx / rayLen : 0;
    const rayUy = rayLen > 0 ? rayDy / rayLen : 0;

    for (let step = 0; step < params.rayIterations; step++) {
        // 1. Find cone & compute step
        const closestIndex = findClosestHeightmapIndex(currentX, pointSpacing);
        const cone = state.coneMap[closestIndex];
        const intersection = calculateIntersectionAlongRay(currentX, currentY, cone, pointSpacing, viewHeight_canvas);
        
        if (!intersection) {
            // Cone step failed → MISS (not a surface hit)
            break;
        }

        // 2. COMPUTE RAY HEIGHT at new position
        const newX = intersection.x;
        const newY = intersection.y;
        const closestHeightIndex = findClosestHeightmapIndex(newX, pointSpacing);
        const surfaceHeightNormalized = state.heightmap[closestHeightIndex];
        const surfaceHeightCanvas = params.sideViewPadding + viewHeight_canvas - surfaceHeightNormalized * scaleFactor * viewHeight_canvas;

        // 3. LINEAR interpolation along the ray to find its Y at newX
        const rayXRange = state.ray.x2 - state.ray.x1;
        const rayYRange = state.ray.y2 - state.ray.y1;
        const fraction = rayXRange !== 0 ? (newX - state.ray.x1) / rayXRange : 0;
        const rayHeightAtNewX = state.ray.y1 + fraction * rayYRange;

        // 4. HEIGHT TEST - THIS IS YOUR STOP CONDITION
        if (rayHeightAtNewX >= surfaceHeightCanvas) {
            // FIRST FAILURE → perfect bracket!
            if (!has_hit) {
                t_fail_point = { x: newX, y: newY, coneIndex: closestHeightIndex };
                has_hit = true;
            }
            break; // Stop coarse stepping
        }
        
        // 5. SUCCESSFUL STEP - update safe position
        t_save_point = { x: newX, y: newY, coneIndex: closestHeightIndex };
        currentX = newX;
        currentY = newY;
        stepPoints.push({ x: currentX, y: currentY, coneIndex: closestIndex });
    }

    return {
        stepPoints,
        currentConeIndex: -1,
        t_save_point,
        t_fail_point,
        has_hit
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
