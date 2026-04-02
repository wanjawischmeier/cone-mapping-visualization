import { params } from '../../../config.js';
import { state } from '../../../state.js';
import { drawCheckbox } from '../components/checkbox.js';
import { drawGenerationButtons } from '../components/generationButtons.js';
import { drawSteppingButton } from '../components/steppingButton.js';
import { drawToggleButtonPair } from '../components/toggleButtonPair.js';
import { drawVisibilityToggles } from '../components/visibilityToggles.js';
import { drawParametersSection } from '../components/parametersSection.js';
import { clearConeMapAndStepping } from '../../../coneMap.js';
import { saveState } from '../../storage.js';

// Control panel layout constants
const PANEL_PADDING_X = 10; // Left and right padding inside panel
const PANEL_PADDING_TOP = 40; // Top padding after title

export function createControlPanel() {
	// This is handled in drawUIPanel for dynamic layout
}

export function drawControlPanel() {
	const uiPanelX = 0;
	const uiPanelY = 0;
	let currentUIY = 25;
	const panelContentWidth = params.uiPanelWidth - (PANEL_PADDING_X * 2);
	const contentStartX = uiPanelX + PANEL_PADDING_X;

	fill(220);
	stroke(100);
	strokeWeight(1);
	rect(uiPanelX, uiPanelY, params.uiPanelWidth, params.canvasHeight);

	// Handle mouse wheel scrolling within the panel
	if (mouseX >= uiPanelX && mouseX <= uiPanelX + params.uiPanelWidth &&
		mouseY >= uiPanelY && mouseY <= uiPanelY + params.canvasHeight) {
		// Mouse wheel scroll (p5.js provides -1 for scroll up, 1 for scroll down)
		if (typeof window.lastMouseWheel !== 'undefined') {
			state.uiScrollOffset = Math.max(0, Math.min(state.uiMaxScrollOffset, state.uiScrollOffset + window.lastMouseWheel * 15));
			window.lastMouseWheel = 0; // Reset after consuming
		}
	}

	// Draw title (always visible)
	fill(0);
	noStroke();
	textSize(14);
	textAlign(LEFT);
	textStyle(BOLD);
	text("Cone Mapping Visualization", uiPanelX + 10, uiPanelY + 15);
	textStyle(NORMAL);

	// Use push/translate for the scrollable content
	push();
	translate(0, -state.uiScrollOffset);

	currentUIY = PANEL_PADDING_TOP;

	// Generation buttons (Heightmap & Cone Map)
	currentUIY = drawGenerationButtons(contentStartX, currentUIY, panelContentWidth);

	// Cone stepping run/pause button
	drawSteppingButton(contentStartX, currentUIY, panelContentWidth);
	currentUIY += 50;

	// Cone mode selector
	currentUIY = drawToggleButtonPair(
		"Cone Mode:",
		"Isotropic",
		"Anisotropic",
		params.coneMode,
		'isotropic',
		'anisotropic',
		contentStartX,
		currentUIY,
		panelContentWidth,
		(newMode) => {
			params.coneMode = newMode;
			clearConeMapAndStepping();
			saveState();
		}
	);

	// Cone generation mode selector
	currentUIY = drawToggleButtonPair(
		"Generation:",
		"Conservative",
		"Exact Relaxed",
		params.coneGenerationMode,
		'conservative',
		'exactRelaxed',
		contentStartX,
		currentUIY,
		panelContentWidth,
		(newMode) => {
			params.coneGenerationMode = newMode;
			clearConeMapAndStepping();
			saveState();
		}
	);

	// Bilinear fix checkbox
	if (drawCheckbox("Bilinear Fix", params.applyBilinearFix, contentStartX, currentUIY)) {
		params.applyBilinearFix = !params.applyBilinearFix;
		clearConeMapAndStepping();
		saveState();
	}
	currentUIY += 30;

	// Visibility toggles (Ray, Cone Stepping, Hovered Cone, Heightmap Interpolated)
	currentUIY = drawVisibilityToggles(contentStartX, currentUIY);

	// Parameters section (sliders)
	currentUIY = drawParametersSection(contentStartX, currentUIY, panelContentWidth);

	// Store the maximum scroll offset (content height minus visible panel height)
	// Leave some padding at the bottom for readability
	const contentHeight = currentUIY + 20; // Final Y position with padding
	const visibleHeight = params.canvasHeight - 40; // Panel height minus title area
	state.uiMaxScrollOffset = Math.max(0, contentHeight - visibleHeight);

	// End scrollable section
	pop();
}
