import { isMouseClicked } from '../inputEvents.js';
import { colors } from '../../config.js';

export function drawToggleButtonPair(sectionLabel, buttonLabelA, buttonLabelB, currentValue, valueA, valueB, x, y, contentWidth, onChangeCallback) {
	fill(colors.text);
	noStroke();
	textSize(10);
	textAlign(LEFT);
	text(sectionLabel, x, y);
	
	let currentY = y + 15;
	const buttonGap = 10;
	const buttonWidth = (contentWidth - buttonGap) / 2;
	
	const isSelectedA = currentValue === valueA;
	
	// Button A
	fill(isSelectedA ? colors.buttonHoverBackground : colors.buttonDefaultBackground);
	stroke(colors.buttonBorder);
	strokeWeight(1);
	rect(x, currentY, buttonWidth, 20);
	fill(colors.buttonText);
	noStroke();
	textSize(9);
	textAlign(CENTER, CENTER);
	text(buttonLabelA, x + buttonWidth / 2, currentY + 10);
	
	if (isMouseClicked(x, currentY, buttonWidth, 20)) {
		onChangeCallback(valueA);
	}
	
	// Button B
	fill(!isSelectedA ? colors.buttonHoverBackground : colors.buttonDefaultBackground);
	stroke(colors.buttonBorder);
	strokeWeight(1);
	rect(x + buttonWidth + buttonGap, currentY, buttonWidth, 20);
	fill(colors.buttonText);
	noStroke();
	textSize(9);
	textAlign(CENTER, CENTER);
	text(buttonLabelB, x + buttonWidth + buttonGap + buttonWidth / 2, currentY + 10);
	
	if (isMouseClicked(x + buttonWidth + buttonGap, currentY, buttonWidth, 20)) {
		onChangeCallback(valueB);
	}
	
	return currentY + 40;
}
