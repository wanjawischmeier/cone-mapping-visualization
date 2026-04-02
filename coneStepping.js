import { params } from "./config.js";
import { state } from "./state.js";
import { Ray } from "./ray.js";
import { getHeightAndCone } from "./helpers/sampling.js";
import { computeConservativeMinStepToCellBorder } from "./helpers/geometry.js";

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

    // Store stepping data in state
    state.steppingData = {
        stepPoints: steppingResult.stepPoints,
        currentConeIndex: steppingResult.currentConeIndex,
        pointSpacing,
        t_save_point: steppingResult.t_save_point,
        t_fail_point: steppingResult.t_fail_point,
        has_hit: steppingResult.has_hit,
        maxIterationsTaken: steppingResult.stepPoints.length - 1, // Number of actual steps taken
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
        has_hit,
    };
}
