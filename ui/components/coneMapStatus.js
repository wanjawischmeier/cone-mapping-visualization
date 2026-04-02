import { coneMap } from '../../state.js';
import { colors } from '../../config.js';

export function drawConeMapStatus(x, y, contentWidth) {
	let coneMapStatus = coneMap.length > 0 ? "✓ Ready" : "✗ Not Generated";
	let statusColor = coneMap.length > 0 ? colors.coneStatus.safe : colors.coneStatus.unsafe;
	
	fill(...statusColor);
	noStroke();
	textSize(10);
	textAlign(RIGHT);
	text(coneMapStatus, x + contentWidth, y);
	textAlign(LEFT);
}
