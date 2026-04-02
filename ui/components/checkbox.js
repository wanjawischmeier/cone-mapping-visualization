import { isMouseClicked } from "../inputEvents.js";

export function drawCheckbox(label, isChecked, x, y, disabled = false) {
	const boxSize = 16;
	const labelX = x + boxSize + 10;

	// Draw checkbox
	if (disabled) {
		fill(200);
		stroke(150);
	} else {
		fill(isChecked ? 100 : 255);
		stroke(50);
	}
	strokeWeight(1);
	rect(x, y, boxSize, boxSize);

	// Draw checkmark if checked
	if (isChecked && !disabled) {
		stroke(255);
		strokeWeight(2);
		noFill();
		line(x + 4, y + 8, x + 7, y + 11);
		line(x + 7, y + 11, x + 12, y + 6);
	}

	// Draw label
	fill(disabled ? 150 : 0);
	noStroke();
	textSize(11);
	textAlign(LEFT, CENTER);
	textStyle(NORMAL);
	text(label, labelX, y + boxSize / 2);

	// Check for click (only if not disabled)
	return !disabled && isMouseClicked(x, y, boxSize, boxSize);
}