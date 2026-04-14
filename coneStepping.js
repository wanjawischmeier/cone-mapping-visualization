import { params } from "./config.js";
import { state } from "./state.js";
import { Ray } from "./ray.js";
import { getHeightAndCone } from "./helpers/sampling.js";
import { computeConservativeMinStepToCellBorder, getClosestPointOnCone } from "./helpers/geometry.js";
import { performBinarySearch } from "./coneBinarySearch.js";

// Check if stepping should run
function shouldPerformStepping() {
    return (
        state.steppingRunning && state.heightmap.length && state.coneMap.length
    );
}

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
        scaleFactor,
    );

    // Perform binary search if enabled
    if (state.uiState.showBinarySearch) {
        const binarySearchResult = performBinarySearch();
        if (binarySearchResult) {
            state.binarySearchData = binarySearchResult;
            
            // Update global max to include binary search points
            if (binarySearchResult.globalMaxDistance > steppingResult.globalMaxDistance) {
                steppingResult.globalMaxDistance = binarySearchResult.globalMaxDistance;
                // Binary search steps are stored separately, so we note this in the stepping data
            }
        }
    } else {
        state.binarySearchData = { binarySearchSteps: [], finalSurfacePoint: null };
    }

    // Store stepping data in state
    state.steppingData = {
        stepPoints: steppingResult.stepPoints,
        currentConeIndex: steppingResult.currentConeIndex,
        pointSpacing,
        t_save_point: steppingResult.t_save_point,
        t_fail_point: steppingResult.t_fail_point,
        has_hit: steppingResult.has_hit,
        maxIterationsTaken: steppingResult.stepPoints.length - 1, // Number of actual steps taken
        tumblingWindowMaxima: steppingResult.tumblingWindowMaxima, // Rolling window maxima
        windowMaxIndices: steppingResult.windowMaxIndices, // Index of max distance point in each window
        globalMaxDistanceIndex: steppingResult.globalMaxDistanceIndex, // Index of global max distance point
        globalMaxDistance: steppingResult.globalMaxDistance, // Updated to include binary search max
    };
}

// Perform stepping with proper termination at first surface hit
function performSteppingWithTermination(
    rayX1,
    rayY1,
    pointSpacing,
    viewHeight_canvas,
    scaleFactor,
) {
    const origSurfaceData = getHeightAndCone(
        rayX1,
        pointSpacing,
        viewHeight_canvas,
        scaleFactor,
    );
    
    // Compute distance from ray origin to cone at origin
    const { pixelLeftSlope: origSlopesLeft, pixelRightSlope: origSlopesRight } = origSurfaceData.cone.getScreenSlopes(
        pointSpacing,
        viewHeight_canvas,
    );
    // Check if global ray orig is inside this cone
    const globalRay = new Ray(state.ray.x1, state.ray.y1, state.ray.x2, state.ray.y2);
    const globalIntersection = globalRay.computeRayStep(
        rayX1,
        origSurfaceData.heightCanvas,
        origSlopesLeft,
        origSlopesRight,
        viewHeight_canvas,
    );

    const origDistanceToRayOrigin = globalIntersection ? getClosestPointOnCone(
        rayX1,
        origSurfaceData.heightCanvas,
        origSlopesLeft,
        origSlopesRight,
        rayX1,
        rayY1,
        viewHeight_canvas
    ).distance : null;
    
    const stepPoints = [{ x: rayX1, y: rayY1, cone: origSurfaceData.cone, distanceToRayOrigin: origDistanceToRayOrigin }];

    let currentX = rayX1;
    let currentY = rayY1;
    let t_save_point = { x: rayX1, y: rayY1, cone: origSurfaceData.cone, distanceToRayOrigin: origDistanceToRayOrigin }; // Start is always safe
    let t_fail_point = null;
    let has_hit = false;

    // Initialize rolling window maxima tracking
    const windowCount = state.tumblingWindowCount;
    const windowSize = state.tumblingWindowSize;
    const tumblingWindowMaxima = Array(windowCount).fill(null); // Store the max distance value for each window
    const windowOffsets = Array(windowCount).fill(0); // Track the step index when each window should be updated
    const windowMaxIndices = Array(windowCount).fill(-1); // Index of the point with max distance in each window
    
    let globalMaxDistance = 0;
    let globalMaxDistanceIndex = 0;

    // Fast fail if the original ray origin is literally inside the ground geometry
    const origSurfaceY = origSurfaceData.heightCanvas;
    if (currentY >= origSurfaceY) {
        return {
            stepPoints,
            currentConeIndex: -1,
            t_save_point: { x: currentX, y: currentY, cone: origSurfaceData.cone, distanceToRayOrigin: origDistanceToRayOrigin },
            t_fail_point: { x: currentX, y: currentY, cone: origSurfaceData.cone, distanceToRayOrigin: origDistanceToRayOrigin },
            has_hit: true,
        };
    }

    for (let step = 0; step < params.rayIterations; step++) {
        // Get the cone at current position (may be interpolated or discrete)
        const coneData = getHeightAndCone(
            currentX,
            pointSpacing,
            viewHeight_canvas,
            scaleFactor,
        );
        const cone = coneData.cone;

        // Cone apex position for algorithm use
        const coneX = currentX;
        const coneY = coneData.heightCanvas;

        // Global ray direction (constant)
        const globalRayDx = state.ray.x2 - state.ray.x1;
        const globalRayDy = state.ray.y2 - state.ray.y1;
        const rayLen = Math.hypot(globalRayDx, globalRayDy);
        if (rayLen < 1e-6) break;
        const rayUx = globalRayDx / rayLen;
        const rayUy = globalRayDy / rayLen;

        const virtualX2 = currentX + globalRayDx;
        const virtualY2 = currentY + globalRayDy;

        // Create ray starting from current position
        const ray = new Ray(currentX, currentY, virtualX2, virtualY2);

        // Compute safe step using algebraic ray-plane intersection
        const { pixelLeftSlope, pixelRightSlope } = cone.getScreenSlopes(
            pointSpacing,
            viewHeight_canvas,
        );
        const intersection = ray.computeRayStep(
            coneX,
            coneY,
            pixelLeftSlope,
            pixelRightSlope,
            viewHeight_canvas,
        );

        if (!intersection) {
            // Cone step failed - either ray origin was outside cone or we've escaped
            if (step > 0) {
                console.warn(
                    "Warning: Ray origin outside cone during stepping. This should not happen unless ray escaped.",
                );
            }
            break;
        }

        let advanceT = intersection.t;

        // Apply "Robust Cone Step Mapping" cell-maximum tracing idea
        // Force the minimum step to reach the next cell boundary
        const minCellStep = computeConservativeMinStepToCellBorder(
            currentX,
            rayUx,
            pointSpacing,
        );
        advanceT = Math.max(advanceT, minCellStep);

        // Calculate newly stepped position
        const newX = currentX + rayUx * advanceT;
        const newY = currentY + rayUy * advanceT;

        const surfaceData = getHeightAndCone(
            newX,
            pointSpacing,
            viewHeight_canvas,
            scaleFactor,
        );
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
        
        // Check if global ray origin is inside this NEW cone we just stepped to
        const { pixelLeftSlope: newLeftSlope, pixelRightSlope: newRightSlope } = surfaceData.cone.getScreenSlopes(
            pointSpacing,
            viewHeight_canvas,
        );
        const globalRay = new Ray(state.ray.x1, state.ray.y1, state.ray.x2, state.ray.y2);
        const globalIntersection = globalRay.computeRayStep(
            newX,
            surfaceData.heightCanvas,
            newLeftSlope,
            newRightSlope,
            viewHeight_canvas,
        );

        // Compute distance from global ray origin to this NEW cone only if origin is inside
        const distanceToRayOrigin = globalIntersection ? getClosestPointOnCone(
            newX,
            surfaceData.heightCanvas,
            newLeftSlope,
            newRightSlope,
            state.ray.x1,
            state.ray.y1,
            viewHeight_canvas
        ).distance : null;
        
        t_save_point = { x: newX, y: newY, cone: surfaceData.cone };
        currentX = newX;
        currentY = newY;

        stepPoints.push({ x: currentX, y: currentY, cone: surfaceData.cone, distanceToRayOrigin });

        // Track global max distance
        if (distanceToRayOrigin !== null && distanceToRayOrigin > globalMaxDistance) {
            globalMaxDistance = distanceToRayOrigin;
            globalMaxDistanceIndex = stepPoints.length - 1; // Current point index
        }
    }

    // After stepping completes, calculate window maxima using the same window calculation as visualization
    const totalSteps = stepPoints.length - 1; // Exclude origin point
    for (let w = 0; w < windowCount; w++) {
        const windowOffset = (windowSize / windowCount) * w;
        const currentPhase = Math.floor((totalSteps - windowOffset) / windowSize);
        const windowStartStep = Math.floor(currentPhase * windowSize + windowOffset);
        const windowStartIdx = windowStartStep + 1; // +1 to account for origin
        const windowEndIdx = Math.min(windowStartIdx + windowSize - 1, stepPoints.length - 1);

        // Find max distance in this window's range
        let maxDist = null;
        let maxIdx = -1;
        for (let idx = windowStartIdx; idx <= windowEndIdx; idx++) {
            if (idx >= 0 && idx < stepPoints.length) {
                const pt = stepPoints[idx];
                if (pt && pt.distanceToRayOrigin !== null && pt.distanceToRayOrigin !== undefined) {
                    if (maxDist === null || pt.distanceToRayOrigin > maxDist) {
                        maxDist = pt.distanceToRayOrigin;
                        maxIdx = idx;
                    }
                }
            }
        }
        
        tumblingWindowMaxima[w] = maxDist;
        windowMaxIndices[w] = maxIdx;
    }

    return {
        stepPoints,
        currentConeIndex: -1,
        t_save_point,
        t_fail_point,
        has_hit,
        tumblingWindowMaxima,
        windowMaxIndices,
        globalMaxDistanceIndex,
        globalMaxDistance,
    };
}
