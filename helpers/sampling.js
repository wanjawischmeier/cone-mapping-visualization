import { params } from '../config.js';
import { state } from '../state.js';
import { Cone } from '../coneMap.js';

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