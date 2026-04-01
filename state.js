import { Ray } from './ray.js';

export class UIState {
	constructor() {
		this.showRay = true;
		this.showConeStepping = true;
		this.showHoveredCone = false;
		this.heightmapInterpolated = true; // true = smooth interpolated, false = nearest neighbor (stepped)
	}

	// Toggle ray visibility
	toggleRay() {
		this.showRay = !this.showRay;
	}

	// Toggle cone stepping visibility
	toggleConeStepping() {
		this.showConeStepping = !this.showConeStepping;
	}

	// Toggle hovered cone visibility
	toggleHoveredCone() {
		this.showHoveredCone = !this.showHoveredCone;
	}

	// Toggle heightmap visualization mode
	toggleHeightmapMode() {
		this.heightmapInterpolated = !this.heightmapInterpolated;
	}

	// Reset to defaults
	reset() {
		this.showRay = true;
		this.showConeStepping = true;
		this.showHoveredCone = false;
		this.heightmapInterpolated = true;
	}
}

export const state = {
	heightmap: [],
	coneMap: [],
	hoveredIndex: -1,
	hoveredX: -1, // Actual x coordinate of hovered position (used for interpolation)
	ray: new Ray(150, 100, 300, 400),
	draggingRayPoint: -1, // -1 = not dragging, 0 = point1, 1 = point2
	uiState: new UIState(),
	prevMousePressed: false, // Track previous frame's mouse state for click detection
	currentIteration: 9, // Start at maximum (params.rayIterations - 1, with default rayIterations = 10)
	draggingIterationSlider: false, // Track if currently dragging iteration slider
	steppingData: { stepPoints: [], currentConeIndex: -1, pointSpacing: 0, t_save_point: null, t_fail_point: null, has_hit: false }, // Data from cone stepping algorithm
	steppingRunning: false, // Whether cone stepping is actively running
	lastSteppingData: { stepPoints: [], currentConeIndex: -1, pointSpacing: 0, t_save_point: null, t_fail_point: null, has_hit: false }, // Last stepping state when paused
	lastRay: { x1: 150, y1: 100, x2: 300, y2: 400 }, // Last ray position when paused
	draggingSlider: {}, // Track which sliders are being dragged
	uiScrollOffset: 0, // Vertical scroll offset for the control panel
	uiMaxScrollOffset: 0, // Maximum scroll offset before hitting bottom of content
};

// Export convenience references that point to state object properties
// This allows `import { heightmap } from state` to still work
export const heightmap = state.heightmap;
export const coneMap = state.coneMap;
export const hoveredIndex = state.hoveredIndex;
export const ray = state.ray;
export const draggingRayPoint = state.draggingRayPoint;
export const uiState = state.uiState;
export const prevMousePressed = state.prevMousePressed;
export const currentIteration = state.currentIteration;
export const draggingIterationSlider = state.draggingIterationSlider;
