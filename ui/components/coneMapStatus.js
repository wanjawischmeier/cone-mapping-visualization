import { coneMap } from '../../state.js';

export function drawConeMapStatus(x, y, contentWidth) {
	let coneMapStatus = coneMap.length > 0 ? "✓ Ready" : "✗ Not Generated";
	let statusColor = coneMap.length > 0 ? [0, 150, 0] : [150, 0, 0];
	
	fill(...statusColor);
	noStroke();
	textSize(10);
	textAlign(RIGHT);
	text(coneMapStatus, x + contentWidth, y);
	textAlign(LEFT);
}
