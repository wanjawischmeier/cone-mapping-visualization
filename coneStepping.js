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

// Get nearest neighbor height and cone at a given x position
function getNearestHeightAndCone(xPos, pointSpacing, viewHeight_canvas, scaleFactor) {
    const index = findClosestHeightmapIndex(xPos, pointSpacing);
    const heightNormalized = state.heightmap[index];
    const heightCanvas = params.sideViewPadding + viewHeight_canvas - heightNormalized * scaleFactor * viewHeight_canvas;
    return {
        heightCanvas,
        coneIndex: index,
        cone: state.coneMap[index]
    };
}

// Get interpolated height and cone at a given x position
// Interpolates height linearly, and uses weighted cone based on proximity
function getInterpolatedHeightAndCone(xPos, pointSpacing, viewHeight_canvas, scaleFactor) {
    const localX = xPos - params.sideViewPadding;
    const floatIndex = localX / pointSpacing;
    const maxIndex = state.heightmap.length - 1;
    
    // Clamp to bounds
    if (floatIndex <= 0) {
        const h = state.heightmap[0];
        const heightCanvas = params.sideViewPadding + viewHeight_canvas - h * scaleFactor * viewHeight_canvas;
        return { heightCanvas, coneIndex: 0, cone: state.coneMap[0] };
    }
    if (floatIndex >= maxIndex) {
        const h = state.heightmap[maxIndex];
        const heightCanvas = params.sideViewPadding + viewHeight_canvas - h * scaleFactor * viewHeight_canvas;
        return { heightCanvas, coneIndex: maxIndex, cone: state.coneMap[maxIndex] };
    }
    
    // Linear interpolation between two nearest points
    const idx0 = Math.floor(floatIndex);
    const idx1 = idx0 + 1;
    const frac = floatIndex - idx0;
    
    const h0 = state.heightmap[idx0];
    const h1 = state.heightmap[idx1];
    const h = h0 * (1 - frac) + h1 * frac;
    
    const heightCanvas = params.sideViewPadding + viewHeight_canvas - h * scaleFactor * viewHeight_canvas;
    
    // Use the closer cone for intersection purposes, or blend if they're equally close
    const coneIndex = frac < 0.5 ? idx0 : idx1;
    
    return {
        heightCanvas,
        coneIndex,
        cone: state.coneMap[coneIndex]
    };
}

// Get height and cone at a given x position, using either interpolated or nearest neighbor based on toggle
function getHeightAndCone(xPos, pointSpacing, viewHeight_canvas, scaleFactor) {
    if (state.uiState.heightmapInterpolated) {
        return getInterpolatedHeightAndCone(xPos, pointSpacing, viewHeight_canvas, scaleFactor);
    } else {
        return getNearestHeightAndCone(xPos, pointSpacing, viewHeight_canvas, scaleFactor);
    }
}

// Perform stepping with proper termination at first surface hit
function performSteppingWithTermination(rayX1, rayY1, pointSpacing, viewHeight_canvas, scaleFactor) {
    const stepPoints = [{ x: rayX1, y: rayY1, coneIndex: -1 }];

    let currentX = rayX1;
    let currentY = rayY1;
    let t_save_point = { x: rayX1, y: rayY1, coneIndex: -1 }; // Start is always safe
    let t_fail_point = null;
    let has_hit = false;
    let lastConeIndex = -1; // Track which cone we last stepped within

    // Fast fail if the original ray origin is literally inside the ground geometry
    const origSurfaceData = getHeightAndCone(currentX, pointSpacing, viewHeight_canvas, scaleFactor);
    const origSurfaceY = origSurfaceData.heightCanvas;
    if (currentY >= origSurfaceY) {
        return {
            stepPoints,
            currentConeIndex: origSurfaceData.coneIndex,
            t_save_point,
            t_fail_point: { x: currentX, y: currentY, coneIndex: origSurfaceData.coneIndex },
            has_hit: true
        };
    }

    for (let step = 0; step < params.rayIterations; step++) {
        // 1. Find cone at current position
        let closestIndex = findClosestHeightmapIndex(currentX, pointSpacing);

        // If we're still in the same cone as the last iteration, force ourselves to the next data point
        // to ensure we always make forward progress through the cone field
        if (closestIndex === lastConeIndex && lastConeIndex >= 0) {
            const nextIndex = closestIndex < state.heightmap.length - 1 ? closestIndex + 1 : closestIndex;
            if (nextIndex !== closestIndex) {
                // Force move to next cone's x position
                const nextConeX = params.sideViewPadding + nextIndex * pointSpacing;
                const rayDx = state.ray.x2 - state.ray.x1;
                const rayDy = state.ray.y2 - state.ray.y1;
                const rayLen = Math.hypot(rayDx, rayDy);
                if (rayLen > 0) {
                    const dx = nextConeX - currentX;
                    // Project forward along the ray direction to reach the next cone's x
                    const t = dx / rayDx; // scalar projection
                    currentX = nextConeX;
                    currentY += t * rayDy;
                    closestIndex = nextIndex;
                } else {
                    break;
                }
            }
        }

        const cone = state.coneMap[closestIndex];
        const { x: coneX, y: coneY } = cone.getScreenPosition(pointSpacing, viewHeight_canvas, params.sideViewPadding);

        // We must calculate the global, constant direction of the master ray
        // and project that direction onto our localized current start position
        // so we don't accidentally reverse direction when stepping PAST state.ray.x2
        const globalRayDx = state.ray.x2 - state.ray.x1;
        const globalRayDy = state.ray.y2 - state.ray.y1;
        const virtualX2 = currentX + globalRayDx;
        const virtualY2 = currentY + globalRayDy;

        // Create ray starting from current position but matching strictly the global master direction
        const ray = new Ray(currentX, currentY, virtualX2, virtualY2);

        // 2. Compute safe step using algebraic ray-plane intersection
        const { pixelLeftSlope, pixelRightSlope } = cone.getScreenSlopes(pointSpacing, viewHeight_canvas);
        const intersection = ray.computeRayStep(coneX, coneY, pixelLeftSlope, pixelRightSlope, viewHeight_canvas);

        if (!intersection) {
            // Cone step failed → it means we have safely cleared this cone. 
            // In a real tracer, this could mean we flew entirely out of the heightfield 
            // without hitting anything, OR we are past the end of the cone geometry.
            break;
        }

        // 3. COMPUTE RAY HEIGHT at new position
        const newX = intersection.x;
        const newY = intersection.y;

        // 4. Check if the newly stepped POSITION is under the surface
        const surfaceData = getHeightAndCone(newX, pointSpacing, viewHeight_canvas, scaleFactor);
        const surfaceHeightCanvas = surfaceData.heightCanvas;

        // Check if the newly stepped POSITION is strictly under the surface (hit!)
        if (newY >= surfaceHeightCanvas) {
            if (!has_hit) {
                // Determine the exact point the ray struck the ground
                t_fail_point = { x: newX, y: newY, coneIndex: surfaceData.coneIndex };
                has_hit = true;
            }
            break;
        }

        // 6. SUCCESSFUL STEP - update safe position
        t_save_point = { x: newX, y: newY, coneIndex: surfaceData.coneIndex };
        currentX = newX;
        currentY = newY;
        lastConeIndex = surfaceData.coneIndex;

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