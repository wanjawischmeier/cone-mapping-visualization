import { isMouseClicked } from "../inputEvents.js";
import { colors } from "../../config.js";

export function drawCheckbox(label, isChecked, x, y, disabled = false) {
	const boxSize = 16;
	const labelX = x + boxSize + 10;

	// Draw checkbox
	if (disabled) {
		fill(colors.checkboxDisabledBackground);
		stroke(colors.checkboxDisabledBorder);
	} else {
		fill(isChecked ? colors.checkboxCheckedBackground : colors.checkboxUncheckedBackground);
		stroke(colors.checkboxBorder);
	}
	strokeWeight(1);
	rect(x, y, boxSize, boxSize);

	// Draw checkmark if checked
	if (isChecked && !disabled) {
		stroke(colors.checkboxCheckmark);
		strokeWeight(2);
		noFill();
		line(x + 4, y + 8, x + 7, y + 11);
		line(x + 7, y + 11, x + 12, y + 6);
	}

	// Draw label
	fill(disabled ? colors.textDisabled : colors.text);
	noStroke();
	textSize(11);
	textAlign(LEFT, CENTER);
	textStyle(NORMAL);
	text(label, labelX, y + boxSize / 2);

	// Check for click (only if not disabled)
	return !disabled && isMouseClicked(x, y, boxSize, boxSize);
}