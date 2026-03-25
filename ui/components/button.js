import { state } from '../../state.js';

export function drawButton(label, x, y, w, h, disabled = false) {
    let isHovering = mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;

    if (disabled) {
        fill(180);
        stroke(120);
    } else {
        fill(isHovering ? 100 : 150);
        stroke(50);
    }
    strokeWeight(2);
    rect(x, y, w, h);

    fill(disabled ? 150 : 255);
    noStroke();
    textSize(12);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    text(label, x + w / 2, y + h / 2);

    // Only return true on click transition (not pressed -> pressed)
    return !disabled && isHovering && mouseIsPressed && !state.prevMousePressed;
}