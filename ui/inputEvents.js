import { state } from '../state.js';

// Detect if mouse clicked (transition from not pressed to pressed)
export function isMouseClicked(x, y, w, h) {
	const isHovering = mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
	const wasPressed = state.prevMousePressed;
	const isPressed = mouseIsPressed;
	return isHovering && isPressed && !wasPressed;
}