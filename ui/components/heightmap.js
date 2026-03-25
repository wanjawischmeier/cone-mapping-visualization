import { params } from '../../config.js';
import { state } from '../../state.js';

export function drawHeightmapProfile(pointSpacing, viewHeight) {
    stroke(0);
    strokeWeight(params.lineWeight);
    noFill();

    beginShape();
    for (let i = 0; i < state.heightmap.length; i++) {
        const x = params.sideViewPadding + i * pointSpacing;
        const y = params.sideViewPadding + viewHeight - state.heightmap[i] * (params.heightmapScale / 100) * viewHeight;
        vertex(x, y);
    }
    endShape();

    // Draw profile points
    fill(0);
    noStroke();
    for (let i = 0; i < state.heightmap.length; i++) {
        const x = params.sideViewPadding + i * pointSpacing;
        const y = params.sideViewPadding + viewHeight - state.heightmap[i] * (params.heightmapScale / 100) * viewHeight;
        circle(x, y, params.pointSize);
    }
}

export function drawHeightmapPoints(pointSpacing, viewHeight) {
    const baseY = params.sideViewPadding + viewHeight + 40;

    for (let i = 0; i < state.heightmap.length; i++) {
        const x = params.sideViewPadding + i * pointSpacing;

        // Color based on scaled height (grayscale)
        const scaledHeight = state.heightmap[i] * (params.heightmapScale / 100);
        const colorValue = Math.min(scaledHeight, 1) * 255;
        fill(colorValue);
        stroke(0);
        strokeWeight(1);

        circle(x, baseY, params.pointSize);
    }

    // Display height value as text when hovering over heightmap points
    if (state.hoveredIndex >= 0 && state.hoveredIndex < state.heightmap.length) {
        const hoveredX = params.sideViewPadding + state.hoveredIndex * pointSpacing;
        const scaledHeight = state.heightmap[state.hoveredIndex] * (params.heightmapScale / 100);

        // Display value above the circle
        fill(0);
        noStroke();
        textSize(11);
        textAlign(CENTER, BOTTOM);
        text(scaledHeight.toFixed(3), hoveredX, baseY - params.pointSize - 5);
    }
}
