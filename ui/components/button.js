import { state } from '../../state.js';
import { colors } from '../../config.js';

export function drawButton(label, x, y, w, h, disabled = false) {
	let isHovering = mouseX > x && mouseX < x + w && state.uiAdjustedMouseY > y && state.uiAdjustedMouseY < y + h;

	if (disabled) {
		fill(colors.buttonDisabledBackground);
		stroke(colors.buttonDisabledBorder);
	} else {
		fill(isHovering ? colors.buttonHoverBackground : colors.buttonDefaultBackground);
		stroke(colors.buttonBorder);
	}
	strokeWeight(2);
	rect(x, y, w, h);

	fill(disabled ? colors.buttonTextDisabled : colors.buttonText);
	noStroke();
	textSize(12);
	textAlign(CENTER, CENTER);
	textStyle(BOLD);
	text(label, x + w / 2, y + h / 2);

	// Only return true on click transition (not pressed -> pressed)
	return !disabled && isHovering && mouseIsPressed && !state.prevMousePressed;
}