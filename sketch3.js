// ============================================================================
// PARAMETERS & CONFIGURATION
// ============================================================================
let params = {
    canvasWidth: 1000,
    canvasHeight: 600,
    heightmapResolution: 25,
    heightmapScale: 60,
    pointSize: 8,
    lineWeight: 2,
    sideViewPadding: 50,
    coneColorIntensity: 0.5,
};

// ============================================================================
// STATE
// ============================================================================
let heightmap = undefined;
let coneMap = undefined;
let hoveredIndex = -1;
let ray = {
    x1: 150,
    y1: 100,
    x2: 300,
    y2: 400
};
let draggingRayPoint = -1; // -1 = not dragging, 0 = point1, 1 = point2
let rayIntersections = []; // Array of intersection objects
let uiState = {
    showRay: true,
    showIntersections: true
};

// ============================================================================
// SETUP & DRAW
// ============================================================================
function setup() {
    createCanvas(params.canvasWidth, params.canvasHeight);

    // Create UI panel on the left side
    createUIPanel();
}

function draw() {
    background(240);

    // Draw main visualization area
    push();
    translate(250, 0);
    drawHeightmapVisualization();
    pop();

    // Draw parameter sliders on the left
    drawUIPanel();
}

function mouseDragged() {
    // Check if dragging a ray point (accounting for the 250px translate)
    const adjustedMouseX = mouseX - 250;
    const dragRadius = 16;

    // Check if we should start dragging
    if (draggingRayPoint === -1) {
        if (dist(adjustedMouseX, mouseY, ray.x1, ray.y1) < dragRadius) {
            draggingRayPoint = 0;
        } else if (dist(adjustedMouseX, mouseY, ray.x2, ray.y2) < dragRadius) {
            draggingRayPoint = 1;
        }
    }

    // Update ray point if dragging
    if (draggingRayPoint === 0) {
        ray.x1 = adjustedMouseX;
        ray.y1 = mouseY;
    } else if (draggingRayPoint === 1) {
        ray.x2 = adjustedMouseX;
        ray.y2 = mouseY;
    }
}

function mouseReleased() {
    draggingRayPoint = -1;
}

// ============================================================================
// HEIGHTMAP GENERATION
// ============================================================================
function generateRandomHeightmap() {
    heightmap = [];
    for (let i = 0; i < params.heightmapResolution; i++) {
        heightmap.push(random(0, 1));
    }
    coneMap = undefined; // Reset cone map when generating new heightmap
    hoveredIndex = -1;
}

// ============================================================================
// CONE MAP GENERATION
// ============================================================================
function generateConeMap() {
    if (heightmap === undefined) {
        console.warn("Cannot generate cone map: heightmap is undefined");
        return;
    }

    coneMap = [];

    // Classic brute force cone stepping algorithm
    // For each point, find the steepest slope to any other point (up or down)
    // This defines the maximum safe cone angle
    for (let i = 0; i < heightmap.length; i++) {
        let maxSlope = 0; // steepest slope found

        // Check all other points
        for (let j = 0; j < heightmap.length; j++) {
            if (i === j) continue;

            const dx = Math.abs(j - i); // horizontal distance in samples
            const dh = heightmap[j] - heightmap[i]; // absolute height difference
            const slope = dh / dx; // slope to this point

            // Track the steepest slope (most constraining)
            maxSlope = Math.max(maxSlope, slope);
        }

        // maxSlope is the tangent of the cone half-angle
        // cone radius in data space = 1.0 / maxSlope (inverted for visualization)
        const coneRadius = maxSlope > 0 ? 1.0 / maxSlope : 1.0;

        coneMap.push({
            height: heightmap[i],
            angle: Math.atan(maxSlope),
            radius: coneRadius,
            index: i
        });
    }

    console.log("Generated cone map with proper cone stepping slopes");
}

// ============================================================================
// RAY-CONE INTERSECTION
// ============================================================================
function rayConeConeIntersection(rayX1, rayY1, rayX2, rayY2, coneX, coneY, coneAngle, pointSpacing, viewHeight) {
    // Ray defined by two points (x1,y1) and (x2,y2)
    // Cone defined by origin at (coneX, coneY), with half-angle coneAngle
    // Cone is infinitely tall and extends upward

    const intersections = [];

    // Ray direction
    const rayDx = rayX2 - rayX1;
    const rayDy = rayY2 - rayY1;
    const rayLen = Math.sqrt(rayDx * rayDx + rayDy * rayDy);

    if (rayLen === 0) return intersections; // degenerate ray

    const rayUx = rayDx / rayLen;
    const rayUy = rayDy / rayLen;

    // Cone parameters
    const scaleFactor = params.heightmapScale / 100;
    const effectiveViewHeight = viewHeight * scaleFactor;
    const slopePixels = Math.tan(coneAngle) * (effectiveViewHeight / pointSpacing);

    // For a cone with infinite height, we only check intersections with the two cone edges (lines forming the cone)

    // Cone left edge: infinitely extended line from (coneX - radius, coneY - height) through (coneX, coneY)
    // Actually, for infinite cone: the line passes through (coneX, coneY) with slope = -slopePixels / dx = up-left direction
    // The cone expands, so left edge goes from (coneX, coneY) upward-left with slope -slopePixels

    // For a more general definition:
    // Left edge line: y - coneY = slopePixels * (x - coneX) for x <= coneX (slanting up-left)
    // Right edge line: y - coneY = -slopePixels * (x - coneX) for x >= coneX (slanting up-right)

    // But we need to be careful about the direction. The cone expands upward.
    // So: Left edge has slope -slopePixels (going up and left from apex)
    //     Right edge has slope +slopePixels (going up and right from apex)

    const leftEdgeSlope = slopePixels;  // y changes at this rate per unit x
    const rightEdgeSlope = -slopePixels;

    // Find intersections with ray
    let leftIntersection = rayInfiniteLineIntersection(rayX1, rayY1, rayX2, rayY2, coneX, coneY, leftEdgeSlope, true);
    let rightIntersection = rayInfiniteLineIntersection(rayX1, rayY1, rayX2, rayY2, coneX, coneY, rightEdgeSlope, false);

    if (leftIntersection) {
        intersections.push(leftIntersection);
    }
    if (rightIntersection) {
        intersections.push(rightIntersection);
    }

    return intersections;
}

// Helper: find intersection of ray with an infinite line (cone edge)
// For left edge: cone edge goes through (coneX, coneY) with given slope (expanding left-upward)
// For right edge: cone edge goes through (coneX, coneY) with given slope (expanding right-upward)
function rayInfiniteLineIntersection(rayX1, rayY1, rayX2, rayY2, lineX, lineY, lineSlope, isLeftEdge) {
    const rayDx = rayX2 - rayX1;
    const rayDy = rayY2 - rayY1;

    // Line equation: y - lineY = lineSlope * (x - lineX)
    // Ray equation: (x, y) = (rayX1, rayY1) + t * (rayDx, rayDy)

    // Substituting ray into line:
    // rayY1 + t*rayDy - lineY = lineSlope * (rayX1 + t*rayDx - lineX)
    // rayY1 + t*rayDy - lineY = lineSlope*rayX1 - lineSlope*lineX + t*lineSlope*rayDx
    // t*rayDy - t*lineSlope*rayDx = lineSlope*rayX1 - lineSlope*lineX - rayY1 + lineY
    // t*(rayDy - lineSlope*rayDx) = lineSlope*(rayX1 - lineX) - (rayY1 - lineY)

    const denom = rayDy - lineSlope * rayDx;

    if (Math.abs(denom) < 1e-6) {
        return null; // ray is parallel to cone edge
    }

    const t = (lineSlope * (rayX1 - lineX) - (rayY1 - lineY)) / denom;

    // Only accept intersections along the ray direction (t > 0)
    if (t < 0) return null;

    const ix = rayX1 + t * rayDx;
    const iy = rayY1 + t * rayDy;

    return { x: ix, y: iy };
}

// ============================================================================
// VISUALIZATION
// ============================================================================
function drawHeightmapVisualization() {
    if (heightmap === undefined) {
        fill(150);
        textAlign(CENTER, CENTER);
        text("Generate a heightmap to start", params.canvasWidth / 2 - 250, params.canvasHeight / 2);
        return;
    }

    const viewHeight = params.canvasHeight - 2 * params.sideViewPadding;
    const viewWidth = params.canvasWidth - 2 * params.sideViewPadding - 250;
    const pointSpacing = viewWidth / (heightmap.length - 1);

    // Draw background for visualization area
    fill(255);
    stroke(200);
    strokeWeight(1);
    rect(params.sideViewPadding, params.sideViewPadding, viewWidth, viewHeight);

    // Draw heightmap profile (side view)
    drawHeightmapProfile(pointSpacing, viewHeight);

    // Draw height field points at bottom with color corresponding to height
    drawHeightFieldPoints(pointSpacing, viewHeight);

    // Update hovered index based on closest x-wise point in entire visualization
    updateHoveredIndexFromMouse(pointSpacing, viewHeight, viewWidth);

    // Draw ray if enabled
    if (uiState.showRay) {
        drawRay(params.sideViewPadding, params.sideViewPadding, viewWidth, viewHeight);
    }

    // Draw cone visualization and intersections if hovering
    if (coneMap !== undefined && hoveredIndex >= 0) {
        rayIntersections = rayConeConeIntersection(ray.x1, ray.y1, ray.x2, ray.y2,
            params.sideViewPadding + hoveredIndex * pointSpacing,
            params.sideViewPadding + viewHeight - heightmap[hoveredIndex] * (params.heightmapScale / 100) * viewHeight,
            coneMap[hoveredIndex].angle,
            pointSpacing,
            viewHeight);

        drawHoveredCone(pointSpacing, viewHeight, viewWidth);

        // Draw ray-cone intersections if enabled
        if (uiState.showIntersections) {
            drawRayIntersections();
        }
    }
}

function updateHoveredIndexFromMouse(pointSpacing, viewHeight, viewWidth) {
    // Account for the 250px translate offset in draw()
    const adjustedMouseX = mouseX - 250;

    // Find closest point x-wise within the visualization area
    const minX = params.sideViewPadding;
    const maxX = params.sideViewPadding + viewWidth;

    hoveredIndex = -1;
    let closestDist = Infinity;

    for (let i = 0; i < heightmap.length; i++) {
        const x = params.sideViewPadding + i * pointSpacing;
        const dist = Math.abs(adjustedMouseX - x);

        if (adjustedMouseX >= minX && adjustedMouseX <= maxX && dist < closestDist) {
            closestDist = dist;
            hoveredIndex = i;
        }
    }
}

function drawHeightmapProfile(pointSpacing, viewHeight) {
    stroke(0);
    strokeWeight(params.lineWeight);
    noFill();

    beginShape();
    for (let i = 0; i < heightmap.length; i++) {
        const x = params.sideViewPadding + i * pointSpacing;
        const scaledHeight = heightmap[i] * (params.heightmapScale / 100);
        const y = params.sideViewPadding + viewHeight - scaledHeight * viewHeight;
        vertex(x, y);
    }
    endShape();

    // Draw profile points
    fill(0);
    noStroke();
    for (let i = 0; i < heightmap.length; i++) {
        const x = params.sideViewPadding + i * pointSpacing;
        const scaledHeight = heightmap[i] * (params.heightmapScale / 100);
        const y = params.sideViewPadding + viewHeight - scaledHeight * viewHeight;
        circle(x, y, params.pointSize);
    }
}

function drawHeightFieldPoints(pointSpacing, viewHeight) {
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

function drawHoveredCone(pointSpacing, viewHeight, viewWidth) {
    if (hoveredIndex < 0 || hoveredIndex >= coneMap.length) return;

    const cone = coneMap[hoveredIndex];
    const x = params.sideViewPadding + hoveredIndex * pointSpacing;

    // Cone origin at the actual profile point
    const scaledHeight = heightmap[hoveredIndex] * (params.heightmapScale / 100);
    const coneOriginY = params.sideViewPadding + viewHeight - scaledHeight * viewHeight;

    // Calculate cone visualization in pixels
    const coneAngle = cone.angle;

    // Account for the height scale when computing pixel slopes
    // The cone angles are computed from unscaled heights [0,1]
    // But we visualize heights scaled by heightmapScale/100
    const scaleFactor = params.heightmapScale / 100;
    const effectiveViewHeight = viewHeight * scaleFactor;

    // Cone expands at rate: tan(angle) in data space
    // Convert to pixels: slope * (effective_view_height / pointSpacing)
    const slopePixels = Math.tan(coneAngle) * (effectiveViewHeight / pointSpacing);

    // Draw cone expanding upward from the profile point
    const coneHeight = effectiveViewHeight; // Extend cone up through scaled view

    // slopePixels is Δy/Δx. So radius (Δx) = height (Δy) / slopePixels
    const coneRadiusAtTop = slopePixels > 0 ? coneHeight / slopePixels : viewWidth * 2;

    stroke(255, 100, 100);
    strokeWeight(2);
    noFill();

    // Left side of cone
    line(x - coneRadiusAtTop, coneOriginY - coneHeight, x, coneOriginY);
    // Right side of cone
    line(x + coneRadiusAtTop, coneOriginY - coneHeight, x, coneOriginY);
    // Base of cone
    line(x - coneRadiusAtTop, coneOriginY - coneHeight, x + coneRadiusAtTop, coneOriginY - coneHeight);

    // Highlight the point
    fill(255, 100, 100);
    circle(x, coneOriginY, params.pointSize + 4);
}

function drawRay(boxMinX, boxMinY, boxWidth, boxHeight) {
    // Visualization box bounds
    const boxMaxX = boxMinX + boxWidth;
    const boxMaxY = boxMinY + boxHeight;

    // Calculate ray direction
    const rayDx = ray.x2 - ray.x1;
    const rayDy = ray.y2 - ray.y1;
    const rayLen = Math.sqrt(rayDx * rayDx + rayDy * rayDy);

    if (rayLen > 0) {
        const rayUx = rayDx / rayLen;
        const rayUy = rayDy / rayLen;

        // Find where ray intersects box boundaries
        // Ray equation: (x, y) = (ray.x1, ray.y1) + t * (rayUx, rayUy), t >= 0

        let minT = 0;         // Start of ray
        let maxT = Infinity;  // End of ray (to be clipped)

        // Clip to x bounds
        if (Math.abs(rayUx) > 1e-6) {
            let tLeft = (boxMinX - ray.x1) / rayUx;
            let tRight = (boxMaxX - ray.x1) / rayUx;
            let tMin = Math.min(tLeft, tRight);
            let tMax = Math.max(tLeft, tRight);
            minT = Math.max(minT, tMin);
            maxT = Math.min(maxT, tMax);
        } else {
            // Ray is vertical
            if (ray.x1 < boxMinX || ray.x1 > boxMaxX) {
                return; // Ray misses box entirely
            }
        }

        // Clip to y bounds
        if (Math.abs(rayUy) > 1e-6) {
            let tTop = (boxMinY - ray.y1) / rayUy;
            let tBottom = (boxMaxY - ray.y1) / rayUy;
            let tMin = Math.min(tTop, tBottom);
            let tMax = Math.max(tTop, tBottom);
            minT = Math.max(minT, tMin);
            maxT = Math.min(maxT, tMax);
        } else {
            // Ray is horizontal
            if (ray.y1 < boxMinY || ray.y1 > boxMaxY) {
                return; // Ray misses box entirely
            }
        }

        if (minT < maxT && maxT >= 0) {
            const startX = ray.x1 + minT * rayUx;
            const startY = ray.y1 + minT * rayUy;
            const endX = ray.x1 + maxT * rayUx;
            const endY = ray.y1 + maxT * rayUy;

            stroke(100, 150, 255);
            strokeWeight(2);
            line(startX, startY, endX, endY);
        }
    }

    // Draw grabbable endpoints (larger)
    fill(100, 150, 255);
    noStroke();
    circle(ray.x1, ray.y1, 16);
    circle(ray.x2, ray.y2, 16);
}

function drawRayIntersections() {
    if (rayIntersections.length === 0) return;

    fill(0, 255, 0);
    noStroke();

    for (let intersection of rayIntersections) {
        circle(intersection.x, intersection.y, 8);
    }
}

// ============================================================================
// UI PANEL
// ============================================================================
let uiPanelX = 10;
let uiPanelY = 10;
let uiPanelWidth = 220;
let currentUIY = uiPanelY + 20;

function createUIPanel() {
    // This is handled in drawUIPanel for dynamic layout
}

function drawUIPanel() {
    fill(220);
    stroke(100);
    strokeWeight(1);
    rect(uiPanelX, uiPanelY, uiPanelWidth, params.canvasHeight - 20);

    fill(0);
    textSize(14);
    textAlign(LEFT);
    textStyle(BOLD);
    text("CONTROLS", uiPanelX + 10, uiPanelY + 25);
    textStyle(NORMAL);

    currentUIY = uiPanelY + 50;

    // Generate Heightmap Button
    if (drawButton("Generate Heightmap", uiPanelX + 10, currentUIY, 200, 30)) {
        generateRandomHeightmap();
    }
    currentUIY += 50;

    // Generate Cone Map Button
    if (drawButton("Generate Cone Map", uiPanelX + 10, currentUIY, 200, 30)) {
        generateConeMap();
    }
    currentUIY += 50;

    // Toggle Ray visibility
    if (drawCheckbox("Show Ray", uiState.showRay, uiPanelX + 10, currentUIY)) {
        uiState.showRay = !uiState.showRay;
    }
    currentUIY += 30;

    // Toggle Ray-Cone Intersections visibility
    if (drawCheckbox("Show Intersections", uiState.showIntersections, uiPanelX + 10, currentUIY)) {
        uiState.showIntersections = !uiState.showIntersections;
    }
    currentUIY += 50;

    textSize(11);
    textStyle(BOLD);
    text("Parameters:", uiPanelX + 10, currentUIY);
    currentUIY += 20;

    textStyle(NORMAL);
    textSize(10);

    // Sliders
    currentUIY = drawSlider("Resolution:", params.heightmapResolution, 10, 100, uiPanelX + 10, currentUIY, 200, (val) => {
        params.heightmapResolution = Math.floor(val);
        heightmap = undefined;
        coneMap = undefined;
    });

    currentUIY = drawSlider("Height Scale:", params.heightmapScale, 10, 200, uiPanelX + 10, currentUIY, 200, (val) => {
        params.heightmapScale = val;
    });

    currentUIY = drawSlider("Point Size:", params.pointSize, 3, 15, uiPanelX + 10, currentUIY, 200, (val) => {
        params.pointSize = val;
    });

    currentUIY = drawSlider("Line Weight:", params.lineWeight, 1, 5, uiPanelX + 10, currentUIY, 200, (val) => {
        params.lineWeight = val;
    });
}

function drawButton(label, x, y, w, h) {
    let isHovering = mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;

    fill(isHovering ? 100 : 150);
    stroke(50);
    strokeWeight(2);
    rect(x, y, w, h);

    fill(255);
    textSize(12);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    text(label, x + w / 2, y + h / 2);

    return isHovering && mouseIsPressed;
}

function drawCheckbox(label, isChecked, x, y) {
    const boxSize = 16;
    const labelX = x + boxSize + 10;

    // Draw checkbox
    fill(isChecked ? 100 : 255);
    stroke(50);
    strokeWeight(1);
    rect(x, y, boxSize, boxSize);

    // Draw checkmark if checked
    if (isChecked) {
        stroke(255);
        strokeWeight(2);
        noFill();
        line(x + 3, y + 8, x + 6, y + 12);
        line(x + 6, y + 12, x + 13, y + 4);
    }

    // Draw label
    fill(0);
    textSize(11);
    textAlign(LEFT, CENTER);
    textStyle(NORMAL);
    text(label, labelX, y + boxSize / 2);

    // Check for click
    let isHovering = mouseX > x && mouseX < x + boxSize && mouseY > y && mouseY < y + boxSize;
    return isHovering && mouseIsPressed;
}

function drawSlider(label, value, min, max, x, y, w, callback) {
    // Label
    fill(0);
    textSize(10);
    textAlign(LEFT);
    text(label, x, y);

    // Slider background
    let sliderY = y + 15;
    fill(200);
    stroke(100);
    strokeWeight(1);
    rect(x, sliderY, w, 8);

    // Slider thumb
    let thumbX = map(value, min, max, x, x + w);

    // Check for interaction
    if (mouseIsPressed && mouseX > x && mouseX < x + w && mouseY > sliderY - 10 && mouseY < sliderY + 18) {
        let newVal = map(mouseX, x, x + w, min, max);
        newVal = constrain(newVal, min, max);
        callback(newVal);
    }

    fill(100);
    circle(thumbX, sliderY + 4, 12);

    // Value display
    fill(0);
    textSize(9);
    textAlign(RIGHT);
    text(value.toFixed(1), x + w, y);

    return y + 40;
}