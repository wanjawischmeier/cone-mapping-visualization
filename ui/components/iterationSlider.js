import { params } from '../../config.js';
import { state } from '../../state.js';

export function drawIterationSlider() {
    const sliderY = 10;
    const sliderWidth = 150;
    const labelX = params.sideViewPadding + 10;
    const sliderX = labelX + 80;

    // Draw label
    fill(0);
    noStroke();
    textSize(11);
    textAlign(LEFT, CENTER);
    textStyle(BOLD);
    text("Step:", labelX, sliderY + 10);
    textStyle(NORMAL);

    // Draw slider background
    fill(220);
    stroke(100);
    strokeWeight(1);
    rect(sliderX, sliderY, sliderWidth, 20);

    // Handle mouse interaction (account for UI panel offset)
    const adjustedMouseX = mouseX - params.uiPanelWidth;
    const isHoveringSlider = adjustedMouseX >= sliderX && adjustedMouseX <= sliderX + sliderWidth &&
        mouseY >= sliderY && mouseY <= sliderY + 20;

    // Start dragging if clicked on slider
    if (isHoveringSlider && mouseIsPressed && !state.prevMousePressed) {
        state.draggingIterationSlider = true;
    }

    // Dragging logic
    if (state.draggingIterationSlider && mouseIsPressed) {
        const ratio = Math.max(0, Math.min(1, (adjustedMouseX - sliderX) / sliderWidth));
        state.currentIteration = Math.floor(ratio * (params.rayIterations - 1));
    } else if (!mouseIsPressed) {
        state.draggingIterationSlider = false;
    }

    // Draw slider thumb
    const thumbX = map(state.currentIteration, 0, params.rayIterations - 1, sliderX, sliderX + sliderWidth);
    fill(state.draggingIterationSlider ? 60 : 100);
    noStroke();
    rect(thumbX - 5, sliderY, 10, 20);

    // Draw label and value
    fill(0);
    noStroke();
    textSize(10);
    textAlign(LEFT, CENTER);
    text(state.currentIteration + " / " + (params.rayIterations - 1), sliderX + sliderWidth + 10, sliderY + 10);
}