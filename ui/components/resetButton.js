import { params, defaultParams } from '../../config.js';
import { state } from '../../state.js';
import { drawButton } from './button.js';
import { clearConeMapAndStepping } from '../../coneMap.js';
import { generateRandomHeightmap } from '../../heightmap.js';
import { saveState } from '../../storage.js';

export function drawResetButton(x, y, contentWidth) {
	if (drawButton("Reset to Defaults", x, y, contentWidth, 30)) {
		// Reset all parameters to defaults
		Object.assign(params, defaultParams);
		
		// Reset UI state to defaults
		state.uiState.reset();
		
		// Clear existing data and generate new
		clearConeMapAndStepping();
        generateRandomHeightmap();
		
		// Reset iteration
		state.currentIteration = params.rayIterations - 1;
		
		// Save the reset state
		saveState();
	}
	
	return y + 40;
}
