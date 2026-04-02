import { coneMap, state } from '../../state.js';
import { drawButton } from './button.js';

export function drawSteppingButton(x, y, contentWidth) {
	const steppingButtonDisabled = state.coneMap.length === 0;
	const steppingLabel = state.steppingRunning ? "Pause Stepping" : "Run Stepping";
	
	if (drawButton(steppingLabel, x, y, contentWidth, 30, steppingButtonDisabled)) {
		// Save current stepping data when pausing
		if (state.steppingRunning) {
			// Save the current ray position and stepping data
			state.lastRay = {
				x1: state.ray.x1,
				y1: state.ray.y1,
				x2: state.ray.x2,
				y2: state.ray.y2
			};
			state.lastSteppingData = {
				stepPoints: [...state.steppingData.stepPoints],
				currentConeIndex: state.steppingData.currentConeIndex,
				pointSpacing: state.steppingData.pointSpacing,
				t_save_point: state.steppingData.t_save_point,
				t_fail_point: state.steppingData.t_fail_point,
				has_hit: state.steppingData.has_hit
			};
			// Clear current stepping data so only last state is shown
			state.steppingData = { stepPoints: [], currentConeIndex: -1, pointSpacing: 0, t_save_point: null, t_fail_point: null, has_hit: false };
		}
		state.steppingRunning = !state.steppingRunning;
	}
}
