// sketch.js - Infinite 2D Cone Stepping (no far plane)
let A, B, dragging = -1;
let ox_slider, oy_slider, ls_slider, rs_slider;

function setup() {
    createCanvas(900, 700);
    A = createVector(200, 400);
    B = createVector(700, 100);

    createP('Origin X: <span id="oxv">450</span>');
    ox_slider = createSlider(50, 850, 450, 1);

    createP('Origin Y: <span id="oyv">500</span>');
    oy_slider = createSlider(400, 650, 500, 1);

    createP('Left slope: <span id="lsv">1.2</span>');
    ls_slider = createSlider(0.1, 3, 1.2, 0.01);

    createP('Right slope: <span id="rsv">0.8</span>');
    rs_slider = createSlider(0.1, 3, 0.8, 0.01);

    [ox_slider, oy_slider, ls_slider, rs_slider].forEach(s => s.input(updateLabels));
    updateLabels();
}

function updateLabels() {
    document.getElementById('oxv').textContent = ox_slider.value();
    document.getElementById('oyv').textContent = oy_slider.value();
    document.getElementById('lsv').textContent = (+ls_slider.value()).toFixed(2);
    document.getElementById('rsv').textContent = (+rs_slider.value()).toFixed(2);
}

function draw() {
    background(20);

    let ox = ox_slider.value();
    let oy = oy_slider.value();
    let leftSlope = ls_slider.value();
    let rightSlope = rs_slider.value();

    // Draw infinite cone (apex DOWN, opening UP)
    stroke(100, 200, 255);
    strokeWeight(3);
    let spread = 350; // for viz only
    let leftBase = { x: ox - leftSlope * spread, y: oy - spread };
    let rightBase = { x: ox + rightSlope * spread, y: oy - spread };
    line(ox, oy, leftBase.x, leftBase.y);
    line(ox, oy, rightBase.x, rightBase.y);

    // Shaded region (truncated for viz)
    fill(100, 200, 255, 40);
    noStroke();
    beginShape();
    vertex(ox, oy);
    vertex(leftBase.x, leftBase.y);
    vertex(rightBase.x, rightBase.y);
    endShape(CLOSE);

    // Apex crosshair
    stroke(255, 150);
    strokeWeight(1);
    line(ox - 10, oy, ox + 10, oy);
    line(ox, oy - 10, ox, oy + 10);

    // Ray handles
    fill(255);
    stroke(255);
    strokeWeight(2);
    circle(A.x, A.y, 16);
    circle(B.x, B.y, 12);

    // Ray
    let rayDir = p5.Vector.sub(B, A).copy().normalize();
    let rayEnd = p5.Vector.add(A, rayDir.copy().mult(800));
    stroke(255, 200, 100, 120);
    strokeWeight(2);
    line(A.x, A.y, rayEnd.x, rayEnd.y);

    // Safe step (infinite cone)
    let stepT = computeSafeStep(A, rayDir, ox, oy, leftSlope, rightSlope);
    if (stepT !== null && stepT > 0) {
        let stepPoint = p5.Vector.add(A, rayDir.copy().mult(stepT));
        stroke(100, 255, 100);
        strokeWeight(4);
        line(A.x, A.y, stepPoint.x, stepPoint.y);
        fill(100, 255, 100);
        noStroke();
        circle(stepPoint.x, stepPoint.y, 12);

        fill(255);
        textSize(14);
        text(`step t=${stepT.toFixed(1)}`, stepPoint.x + 15, stepPoint.y - 5);
    } else {
        fill(255, 100);
        textSize(14);
        text('outside cone', A.x + 20, A.y - 10);
    }
}

function computeSafeStep(pos, dir, ox, oy, leftSlope, rightSlope) {
    // Local frame: z=forward=UP=(-y direction), x=lateral=right(+x)
    // Flip y for z increasing upward from apex
    let localPos = createVector(pos.x - ox, oy - pos.y); // z = oy - pos.y
    let px0 = localPos.x;
    let pz0 = localPos.y;
    let dx = dir.x;
    let dz = -dir.y; // flip for z-up

    // Infinite cone: outside if wrong side of planes at pz0
    if (pz0 <= 0) return null;
    if (px0 < -leftSlope * pz0 || px0 > rightSlope * pz0) return null;

    let ts = [];

    // Left plane: x + leftSlope * z = 0
    // px0 + t*dx + leftSlope*(pz0 + t*dz) = 0
    let aL = dx + leftSlope * dz;
    let bL = px0 + leftSlope * pz0;
    if (Math.abs(aL) > 1e-6) {
        let tL = -bL / aL;
        if (tL > 1e-6) ts.push(tL);
    }

    // Right plane: x - rightSlope * z = 0
    let aR = dx - rightSlope * dz;
    let bR = px0 - rightSlope * pz0;
    if (Math.abs(aR) > 1e-6) {
        let tR = -bR / aR;
        if (tR > 1e-6) ts.push(tR);
    }

    return ts.length > 0 ? Math.min(...ts) : null;
}

function mousePressed() {
    let da = dist(mouseX, mouseY, A.x, A.y);
    let db = dist(mouseX, mouseY, B.x, B.y);
    dragging = (da < 20) ? 0 : (db < 20 ? 1 : -1);
}

function mouseDragged() {
    if (dragging === 0) {
        A.set(constrain(mouseX, 20, width - 20), constrain(mouseY, 20, height - 20));
    } else if (dragging === 1) {
        B.set(constrain(mouseX, 20, width - 20), constrain(mouseY, 20, height - 20));
    }
}

function mouseReleased() {
    dragging = -1;
}
