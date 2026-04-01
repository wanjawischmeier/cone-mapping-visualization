import { params } from './config.js';
import { generateRandomHeightmap } from './heightmap.js';
import { drawHeightmapVisualization } from './ui/visualization.js';
import { createUIPanel, drawUIPanel } from './ui/ui.js';
import { state } from './state.js';
import { performConeStepping } from './coneStepping.js';
import { loadState, saveState } from './storage.js';

function setup() {
	createCanvas(params.canvasWidth, params.canvasHeight);

	// Load saved state from localStorage
	loadState();

	createUIPanel();

	// Generate initial heightmap only
	generateRandomHeightmap();

	// Clamp ray positions to heightmap area
	clampRayToHeightmapArea();
}

function draw() {
	background(240);

	// Draw main visualization area
	push();
	translate(params.uiPanelWidth, 0);
	drawHeightmapVisualization();
	pop();

	// Draw parameter sliders on the left
	drawUIPanel();

	// Update cone stepping data for visualization
	performConeStepping();

	// Update previous frame's mouse state for click detection
	state.prevMousePressed = mouseIsPressed;
}

function windowResized() {
	resizeCanvas(params.canvasWidth, params.canvasHeight);

	// Clamp ray positions to heightmap area after resize
	clampRayToHeightmapArea();
}

function clampRayToHeightmapArea() {
	// Calculate visualization bounds
	const viewHeight = params.canvasHeight - 2 * params.sideViewPadding;
	const viewWidth = params.canvasWidth - params.uiPanelWidth - 2 * params.sideViewPadding;
	const minX = params.sideViewPadding;
	const maxX = params.sideViewPadding + viewWidth;
	const minY = params.sideViewPadding;
	const maxY = params.sideViewPadding + viewHeight;

	// Clamp both ray points
	state.ray.setPoint1(
		constrain(state.ray.x1, minX, maxX),
		constrain(state.ray.y1, minY, maxY)
	);
	state.ray.setPoint2(
		constrain(state.ray.x2, minX, maxX),
		constrain(state.ray.y2, minY, maxY)
	);
}

function mouseDragged() {
	// Check if dragging a ray point (accounting for the UI panel offset)
	const adjustedMouseX = mouseX - params.uiPanelWidth;
	const dragRadius = 16;

	// Check if we should start dragging
	if (state.draggingRayPoint === -1) {
		const nearPoints = state.ray.isNearPoint(adjustedMouseX, mouseY, dragRadius);
		if (nearPoints.point1) {
			state.draggingRayPoint = 0;
		} else if (nearPoints.point2) {
			state.draggingRayPoint = 1;
		}
	}

	// Calculate visualization bounds
	const viewHeight = params.canvasHeight - 2 * params.sideViewPadding;
	const viewWidth = params.canvasWidth - params.uiPanelWidth - 2 * params.sideViewPadding;
	const minX = params.sideViewPadding;
	const maxX = params.sideViewPadding + viewWidth;
	const minY = params.sideViewPadding;
	const maxY = params.sideViewPadding + viewHeight;

	// Update ray point if dragging, with bounds checking
	if (state.draggingRayPoint === 0) {
		state.ray.setPoint1(constrain(adjustedMouseX, minX, maxX), constrain(mouseY, minY, maxY));
	} else if (state.draggingRayPoint === 1) {
		state.ray.setPoint2(constrain(adjustedMouseX, minX, maxX), constrain(mouseY, minY, maxY));
	}
}

function mouseReleased() {
	// Save ray position when released
	if (state.draggingRayPoint !== -1) {
		saveState();
	}
	state.draggingRayPoint = -1;
}

function mouseWheel(event) {
	// Check if mouse is over UI panel for scrolling
	if (mouseX >= 0 && mouseX <= params.uiPanelWidth) {
		window.lastMouseWheel = event.delta > 0 ? 1 : -1;
		return false; // Prevent default scrolling
	}

	// Mouse wheel to change iteration (over heightmap visualization)
	const viewHeight = params.canvasHeight - 2 * params.sideViewPadding;
	const viewWidth = params.canvasWidth - params.uiPanelWidth - 2 * params.sideViewPadding;
	const adjustedMouseX = mouseX - params.uiPanelWidth;
	const minX = params.sideViewPadding;
	const maxX = params.sideViewPadding + viewWidth;
	const minY = params.sideViewPadding;
	const maxY = params.sideViewPadding + viewHeight;

	// Check if mouse is over heightmap visualization area
	if (adjustedMouseX >= minX && adjustedMouseX <= maxX && mouseY >= minY && mouseY <= maxY) {
		if (event.delta > 0) {
			state.currentIteration = Math.max(0, state.currentIteration - 1);
		} else {
			state.currentIteration = Math.min(params.rayIterations - 1, state.currentIteration + 1);
		}
		event.preventDefault();
		return false;
	}
}

function mousePressed() {
	// Only reset iteration if specifically not dragging the slider or ray
	// Do not automatically reset on general clicks
	return false;
}

// Expose p5 lifecycle functions to global scope
window.setup = setup;
window.draw = draw;
window.windowResized = windowResized;
window.mouseDragged = mouseDragged;
window.mouseReleased = mouseReleased;
window.mouseWheel = mouseWheel;
window.mousePressed = mousePressed;
