import { state } from '../state.js';

// Detect if mouse clicked (transition from not pressed to pressed)
export function isMouseClicked(x, y, w, h) {
	const adjustedMouseY = state.uiAdjustedMouseY !== undefined ? state.uiAdjustedMouseY : mouseY;
	const isHovering = mouseX > x && mouseX < x + w && adjustedMouseY > y && adjustedMouseY < y + h;
	const wasPressed = state.prevMousePressed;
	const isPressed = mouseIsPressed;
	return isHovering && isPressed && !wasPressed;
}