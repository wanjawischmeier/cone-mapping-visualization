import { params } from '../../../config.js';
import { state } from '../../../state.js';
import { drawHeightmapSettings } from '../components/heightmapSettings.js';
import { drawConeMapSettings } from '../components/coneMapSettings.js';
import { drawVisualizationSettings } from '../components/visualizationSettings.js';
import { drawResetButton } from '../components/resetButton.js';

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
			state.uiScrollOffset = Math.max(0, Math.min(state.uiMaxScrollOffset, state.uiScrollOffset + window.lastMouseWheel * 25));
			window.lastMouseWheel = 0; // Reset after consuming
		}
	}

	// Calculate adjusted mouse Y for scrolled content
	const adjustedMouseY = mouseY + state.uiScrollOffset;

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

	// Store adjusted mouse Y in state for components to use
	state.uiAdjustedMouseY = adjustedMouseY;

	currentUIY = PANEL_PADDING_TOP;

	// Heightmap settings section
	currentUIY = drawHeightmapSettings(contentStartX, currentUIY, panelContentWidth);

	// Cone map settings section
	currentUIY = drawConeMapSettings(contentStartX, currentUIY, panelContentWidth);

	// Visualization settings section
	currentUIY = drawVisualizationSettings(contentStartX, currentUIY, panelContentWidth);

	// Reset button at the bottom
	currentUIY += 20; // Add some spacing before reset button
	currentUIY = drawResetButton(contentStartX, currentUIY, panelContentWidth);

	// Store the maximum scroll offset (content height minus visible panel height)
	// Leave some padding at the bottom for readability
	const contentHeight = currentUIY + 20; // Final Y position with padding
	const visibleHeight = params.canvasHeight - 40; // Panel height minus title area
	state.uiMaxScrollOffset = Math.max(0, contentHeight - visibleHeight);

	// End scrollable section
	pop();
}
