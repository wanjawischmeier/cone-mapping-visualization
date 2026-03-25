import { state } from '../../state.js';

export function drawSlider(label, value, min, max, x, y, w, callback, onRelease) {
    // Label
    fill(0);
    noStroke();
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
    let isHoveringSlider = mouseX > x && mouseX < x + w && mouseY > sliderY - 10 && mouseY < sliderY + 18;
    let wasPressingSlider = state.draggingSlider?.[label] || false;

    if (mouseIsPressed && isHoveringSlider) {
        const newVal = map(mouseX, x, x + w, min, max);
        callback(constrain(newVal, min, max));
        state.draggingSlider = state.draggingSlider || {};
        state.draggingSlider[label] = true;
    } else if (!mouseIsPressed && wasPressingSlider && onRelease) {
        // Slider was released
        onRelease();
        state.draggingSlider = state.draggingSlider || {};
        state.draggingSlider[label] = false;
    } else if (!mouseIsPressed) {
        if (state.draggingSlider) {
            state.draggingSlider[label] = false;
        }
    }

    fill(100);
    noStroke();
    circle(thumbX, sliderY + 4, 12);

    // Value display
    fill(0);
    noStroke();
    textSize(9);
    textAlign(RIGHT);
    text(value.toFixed(1), x + w, y);

    return y + 40;
}
