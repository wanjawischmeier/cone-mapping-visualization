import { params } from './config.js';
import { state } from './state.js';
import { Ray } from './ray.js';

// Perform cone stepping along the ray and returns step data
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

    for (let step = 0; step < params.rayIterations; step++) {
        // 1. Find cone at current position
        const closestIndex = findClosestHeightmapIndex(currentX, pointSpacing);
        const cone = state.coneMap[closestIndex];
        const { x: coneX, y: coneY } = cone.getScreenPosition(pointSpacing, viewHeight_canvas, params.sideViewPadding);

        // Create ray starting from current position
        const ray = new Ray(currentX, currentY, state.ray.x2, state.ray.y2);
        
        // 2. Compute safe step using algebraic ray-plane intersection
        const { pixelLeftSlope, pixelRightSlope } = cone.getScreenSlopes(pointSpacing, viewHeight_canvas);
        const intersection = ray.computeRayStep(coneX, coneY, pixelLeftSlope, pixelRightSlope, viewHeight_canvas);
        
        if (!intersection) {
            // Cone step failed → MISS (not a surface hit)
            break;
        }

        // 3. COMPUTE RAY HEIGHT at new position
        const newX = intersection.x;
        const newY = intersection.y;
        const closestHeightIndex = findClosestHeightmapIndex(newX, pointSpacing);
        const surfaceHeightNormalized = state.heightmap[closestHeightIndex];
        const surfaceHeightCanvas = params.sideViewPadding + viewHeight_canvas - surfaceHeightNormalized * scaleFactor * viewHeight_canvas;

        // 4. LINEAR interpolation along the ray to find its Y at newX
        const rayXRange = state.ray.x2 - state.ray.x1;
        const rayYRange = state.ray.y2 - state.ray.y1;
        const fraction = rayXRange !== 0 ? (newX - state.ray.x1) / rayXRange : 0;
        const rayHeightAtNewX = state.ray.y1 + fraction * rayYRange;

        // 5. HEIGHT TEST - THIS IS YOUR STOP CONDITION
        if (rayHeightAtNewX >= surfaceHeightCanvas) {
            // FIRST FAILURE → perfect bracket!
            if (!has_hit) {
                t_fail_point = { x: newX, y: newY, coneIndex: closestHeightIndex };
                has_hit = true;
            }
            break; // Stop coarse stepping
        }
        
        // 6. SUCCESSFUL STEP - update safe position
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
