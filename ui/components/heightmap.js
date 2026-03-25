function drawHeightmapProfile(pointSpacing, viewHeight) {
    stroke(0);
    strokeWeight(params.lineWeight);
    noFill();

    beginShape();
    for (let i = 0; i < heightmap.length; i++) {
        const x = params.sideViewPadding + i * pointSpacing;
        const y = params.sideViewPadding + viewHeight - heightmap[i] * (params.heightmapScale / 100) * viewHeight;
        vertex(x, y);
    }
    endShape();

    // Draw profile points
    fill(0);
    noStroke();
    for (let i = 0; i < heightmap.length; i++) {
        const x = params.sideViewPadding + i * pointSpacing;
        const y = params.sideViewPadding + viewHeight - heightmap[i] * (params.heightmapScale / 100) * viewHeight;
        circle(x, y, params.pointSize);
    }
}

function drawHeightmapPoints(pointSpacing, viewHeight) {
    const baseY = params.sideViewPadding + viewHeight + 40;

    for (let i = 0; i < heightmap.length; i++) {
        const x = params.sideViewPadding + i * pointSpacing;

        // Color based on scaled height (grayscale)
        const scaledHeight = heightmap[i] * (params.heightmapScale / 100);
        const colorValue = Math.min(scaledHeight, 1) * 255;
        fill(colorValue);
        stroke(0);
        strokeWeight(1);

        circle(x, baseY, params.pointSize);
    }
}