import { params } from '../../config.js';
import { heightmap, coneMap, state } from '../../state.js';
import { clipLineToBox } from './shapes.js';
import { Ray } from '../../ray.js';

export function drawRayStepping(pointSpacing, viewHeight, viewWidth) {
    if (!heightmap.length || !coneMap.length) return;

    const viewHeight_canvas = params.canvasHeight - 2 * params.sideViewPadding;
    const scaleFactor = params.heightmapScale / 100;
    const boxMinX = params.sideViewPadding;
    const boxMinY = params.sideViewPadding;
    const boxMaxX = params.sideViewPadding + viewWidth;
    const boxMaxY = params.sideViewPadding + viewHeight_canvas;

    // Perform actual cone stepping
    let currentX = state.ray.x1;
    let currentY = state.ray.y1;
    const stepPoints = [{ x: currentX, y: currentY }]; // Include starting point
    let lastUsedIndex = -1;

    for (let step = 0; step < state.currentIteration; step++) {
        // Find closest heightmap point (but different from last used index)
        let closestIndex = 0;
        let closestDist = Infinity;
        for (let i = 0; i < heightmap.length; i++) {
            // Skip the last used index to ensure progress
            if (i === lastUsedIndex) continue;

            const ptX = params.sideViewPadding + i * pointSpacing;
            const dist = Math.abs(currentX - ptX);
            if (dist < closestDist) {
                closestDist = dist;
                closestIndex = i;
            }
        }

        // If all points except lastUsedIndex were skipped, use lastUsedIndex's neighbor
        if (closestIndex === lastUsedIndex) {
            if (lastUsedIndex > 0) closestIndex = lastUsedIndex - 1;
            else closestIndex = lastUsedIndex + 1;
        }

        lastUsedIndex = closestIndex;

        // Get cone at this point
        const cone = coneMap[closestIndex];
        const coneX = params.sideViewPadding + closestIndex * pointSpacing;
        const coneHeightY = params.sideViewPadding + viewHeight_canvas - heightmap[closestIndex] * scaleFactor * viewHeight_canvas;

        // Calculate ray-cone intersection
        // Using a very distant point for ray2 to ensure it acts as an infinite ray
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
        if (intersections.length > 0) {

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

            if (closestIntersection) {
                currentX = closestIntersection.x;
                currentY = closestIntersection.y;
                stepPoints.push({ x: currentX, y: currentY });
            } else {
                break; // No valid intersection ahead
            }
        } else {
            break; // No intersection
        }
    }

    // Draw all step points up to current iteration
    for (let i = 0; i < stepPoints.length; i++) {
        const pt = stepPoints[i];
        const isCurrent = i === stepPoints.length - 1;
        const stepColor = isCurrent ? [200, 100, 200] : [150, 150, 255];
        fill(...stepColor);
        noStroke();
        circle(pt.x, pt.y, 8);
    }

    // For current iteration, draw its cone in purple
    if (stepPoints.length > 1) {
        const currentPt = stepPoints[stepPoints.length - 1];

        // Find closest heightmap point to current stepping position
        let closestIndex = 0;
        let closestDist = Infinity;
        for (let i = 0; i < heightmap.length; i++) {
            const ptX = params.sideViewPadding + i * pointSpacing;
            const dist = Math.abs(currentPt.x - ptX);
            if (dist < closestDist) {
                closestDist = dist;
                closestIndex = i;
            }
        }

        const cone = coneMap[closestIndex];
        const coneX = params.sideViewPadding + closestIndex * pointSpacing;
        const coneHeightY = params.sideViewPadding + viewHeight_canvas - heightmap[closestIndex] * scaleFactor * viewHeight_canvas;

        const coneAngle = cone.angle;
        const effectiveViewHeight = viewHeight_canvas * scaleFactor;
        const slopePixels = Math.tan(coneAngle) * (effectiveViewHeight / pointSpacing);

        // Draw cone edges in purple
        const leftEdge = clipLineToBox(coneX, coneHeightY, -1, -slopePixels, boxMinX, boxMinY, boxMaxX, boxMaxY);
        if (leftEdge) {
            stroke(200, 100, 200);
            strokeWeight(2);
            line(leftEdge.startX, leftEdge.startY, leftEdge.endX, leftEdge.endY);
        }

        const rightEdge = clipLineToBox(coneX, coneHeightY, 1, -slopePixels, boxMinX, boxMinY, boxMaxX, boxMaxY);
        if (rightEdge) {
            stroke(200, 100, 200);
            strokeWeight(2);
            line(rightEdge.startX, rightEdge.startY, rightEdge.endX, rightEdge.endY);
        }

        // Apex point
        fill(200, 100, 200);
        noStroke();
        circle(coneX, coneHeightY, 10);
    }
}