import { params } from './config.js';
import { state } from './state.js';
import { Ray } from './ray.js';
import { Cone } from './coneMap.js';

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

// Get nearest neighbor height and cone at a given x position
export function getNearestHeightAndCone(xPos, pointSpacing, viewHeight_canvas, scaleFactor) {
    const index = findClosestHeightmapIndex(xPos, pointSpacing);
    const heightNormalized = state.heightmap[index];
    const heightCanvas = params.sideViewPadding + viewHeight_canvas - heightNormalized * scaleFactor * viewHeight_canvas;
    return {
        heightCanvas,
        cone: state.coneMap[index],
        x: xPos
    };
}

// Get interpolated height and cone at a given x position
// Returns an actual Cone object with interpolated slopes, not a reference to a discrete cone
export function getInterpolatedHeightAndCone(xPos, pointSpacing, viewHeight_canvas, scaleFactor) {
    const localX = xPos - params.sideViewPadding;
    const floatIndex = localX / pointSpacing;
    const maxIndex = state.heightmap.length - 1;
    
    // Clamp to bounds and use nearest cone at boundary
    if (floatIndex <= 0) {
        const h = state.heightmap[0];
        const heightCanvas = params.sideViewPadding + viewHeight_canvas - h * scaleFactor * viewHeight_canvas;
        return { 
            heightCanvas, 
            cone: state.coneMap[0],
            x: xPos
        };
    }
    if (floatIndex >= maxIndex) {
        const h = state.heightmap[maxIndex];
        const heightCanvas = params.sideViewPadding + viewHeight_canvas - h * scaleFactor * viewHeight_canvas;
        return { 
            heightCanvas, 
            cone: state.coneMap[maxIndex],
            x: xPos
        };
    }
    
    // Linear interpolation between two nearest points
    const idx0 = Math.floor(floatIndex);
    const idx1 = idx0 + 1;
    const frac = floatIndex - idx0;
    
    // Interpolate height
    const h0 = state.heightmap[idx0];
    const h1 = state.heightmap[idx1];
    const h = h0 * (1 - frac) + h1 * frac;
    const heightCanvas = params.sideViewPadding + viewHeight_canvas - h * scaleFactor * viewHeight_canvas;
    
    // Interpolate slopes to create a new virtual cone
    const leftSlope0 = state.coneMap[idx0].leftSlope;
    const leftSlope1 = state.coneMap[idx1].leftSlope;
    const leftSlope = leftSlope0 * (1 - frac) + leftSlope1 * frac;
    
    const rightSlope0 = state.coneMap[idx0].rightSlope;
    const rightSlope1 = state.coneMap[idx1].rightSlope;
    const rightSlope = rightSlope0 * (1 - frac) + rightSlope1 * frac;
    
    // Create an interpolated cone object with height h
    const interpolatedCone = new Cone(h, leftSlope, rightSlope, -1); // index -1 means virtual/interpolated
    
    return {
        heightCanvas,
        cone: interpolatedCone,
        x: xPos
    };
}

// Get height and cone at a given x position, using either interpolated or nearest neighbor based on toggle
export function getHeightAndCone(xPos, pointSpacing, viewHeight_canvas, scaleFactor) {
    if (state.uiState.heightmapInterpolated) {
        return getInterpolatedHeightAndCone(xPos, pointSpacing, viewHeight_canvas, scaleFactor);
    } else {
        return getNearestHeightAndCone(xPos, pointSpacing, viewHeight_canvas, scaleFactor);
    }
}

// Perform stepping with proper termination at first surface hit
function performSteppingWithTermination(rayX1, rayY1, pointSpacing, viewHeight_canvas, scaleFactor) {
    const origSurfaceData = getHeightAndCone(rayX1, pointSpacing, viewHeight_canvas, scaleFactor);
    const stepPoints = [{ x: rayX1, y: rayY1, cone: origSurfaceData.cone }];

    let currentX = rayX1;
    let currentY = rayY1;
    let t_save_point = { x: rayX1, y: rayY1, cone: origSurfaceData.cone }; // Start is always safe
    let t_fail_point = null;
    let has_hit = false;

    // Fast fail if the original ray origin is literally inside the ground geometry
    const origSurfaceY = origSurfaceData.heightCanvas;
    if (currentY >= origSurfaceY) {
        return {
            stepPoints,
            currentConeIndex: -1,
            t_save_point: { x: currentX, y: currentY, cone: origSurfaceData.cone },
            t_fail_point: { x: currentX, y: currentY, cone: origSurfaceData.cone },
            has_hit: true
        };
    }

    for (let step = 0; step < params.rayIterations; step++) {
        // Find which discrete cone we're closest to (for navigation, not algorithm logic)
        let closestIndex = findClosestHeightmapIndex(currentX, pointSpacing);
        
        // If we're not making horizontal progress, move forward slightly along the continuous ray
        // This replaces the old discrete logic that forced currentX to the next integer cone index
        const minStepX = 0.5; // Minimum horizontal progress we expect
        if (step > 0 && Math.abs(currentX - stepPoints[stepPoints.length - 1].x) < minStepX) {
            const rayDx = state.ray.x2 - state.ray.x1;
            const rayDy = state.ray.y2 - state.ray.y1;
            const rayLen = Math.hypot(rayDx, rayDy);
            if (rayLen > 0) {
                // Just push the ray slightly forward along its analytical vector to prevent floating-point stiction
                const epsilonDist = 1.0; 
                currentX += (rayDx / rayLen) * epsilonDist;
                currentY += (rayDy / rayLen) * epsilonDist;
            } else {
                break;
            }
        }

        // Get the cone at current position (may be interpolated or discrete)
        const coneData = getHeightAndCone(currentX, pointSpacing, viewHeight_canvas, scaleFactor);
        const cone = coneData.cone;
        
        // Cone apex position for algorithm use
        const coneX = currentX;
        const coneY = coneData.heightCanvas;

        // Global ray direction (constant)
        const globalRayDx = state.ray.x2 - state.ray.x1;
        const globalRayDy = state.ray.y2 - state.ray.y1;
        const virtualX2 = currentX + globalRayDx;
        const virtualY2 = currentY + globalRayDy;

        // Create ray starting from current position
        const ray = new Ray(currentX, currentY, virtualX2, virtualY2);

        // Compute safe step using algebraic ray-plane intersection
        const { pixelLeftSlope, pixelRightSlope } = cone.getScreenSlopes(pointSpacing, viewHeight_canvas);
        const intersection = ray.computeRayStep(coneX, coneY, pixelLeftSlope, pixelRightSlope, viewHeight_canvas);

        if (!intersection) {
            // Cone step failed - either ray origin was outside cone (shouldn't happen!) or we've escaped
            // Log warning if we're in the middle of stepping (not the first iteration)
            if (step > 0) {
                console.warn('Warning: Ray origin outside cone during stepping. This should not happen.');
            }
            // Cone step failed → we have safely cleared this cone or encountered invalid state
            break;
        }

        // Check if newly stepped position is under the surface
        const newX = intersection.x;
        const newY = intersection.y;

        const surfaceData = getHeightAndCone(newX, pointSpacing, viewHeight_canvas, scaleFactor);
        const surfaceHeightCanvas = surfaceData.heightCanvas;

        // Check if the ray is below the surface (hit!)
        if (newY >= surfaceHeightCanvas) {
            if (!has_hit) {
                t_fail_point = { x: newX, y: newY, cone: surfaceData.cone };
                has_hit = true;
            }
            break;
        }

        // Successful step - update safe position and current location
        // We already computed the surface data at this new position above, no need to re-compute
        t_save_point = { x: newX, y: newY, cone: surfaceData.cone };
        currentX = newX;
        currentY = newY;

        stepPoints.push({ x: currentX, y: currentY, cone: surfaceData.cone });
    }

    return {
        stepPoints,
        currentConeIndex: -1,
        t_save_point,
        t_fail_point,
        has_hit
    };
}