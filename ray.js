import { params } from './config.js';

export class Ray {
	constructor(x1 = 150, y1 = 100, x2 = 300, y2 = 400) {
		this.x1 = x1;
		this.y1 = y1;
		this.x2 = x2;
		this.y2 = y2;
	}

	// Get direction vector
	getDirection() {
		return {
			dx: this.x2 - this.x1,
			dy: this.y2 - this.y1
		};
	}

	// Get length of ray
	getLength() {
		const { dx, dy } = this.getDirection();
		return Math.sqrt(dx * dx + dy * dy);
	}

	// Get normalized direction vector
	getNormalizedDirection() {
		const len = this.getLength();
		if (len === 0) return { ux: 0, uy: 0 };
		const { dx, dy } = this.getDirection();
		return { ux: dx / len, uy: dy / len };
	}

	// Set endpoint 0
	setPoint1(x, y) {
		this.x1 = x;
		this.y1 = y;
	}

	// Set endpoint 1
	setPoint2(x, y) {
		this.x2 = x;
		this.y2 = y;
	}

	// Check if point is near either endpoint
	isNearPoint(x, y, distance) {
		const dist1 = Math.hypot(x - this.x1, y - this.y1);
		const dist2 = Math.hypot(x - this.x2, y - this.y2);
		return {
			point1: dist1 < distance,
			point2: dist2 < distance
		};
	}

	// Compute safe stepping distance along ray for a given cone
	// Returns {x, y, t} point where ray intersects cone boundary, or null if no intersection
	// Assumes ray origin is inside the cone
	// Slopes provided should be in math/pixel space (dz/dx)
	computeRayStep(coneX, coneY, pixelLeftSlope, pixelRightSlope, viewHeight) {
		// Get ray direction
		const rayDx = this.x2 - this.x1;
		const rayDy = this.y2 - this.y1;
		const rayLen = Math.sqrt(rayDx * rayDx + rayDy * rayDy);
		if (rayLen < 1e-6) return null; // degenerate ray
		
		const rayUx = rayDx / rayLen;
		const rayUy = rayDy / rayLen;

		// Check if ray origin is inside cone
		// In p5.js, cone expands UPWARD visually (smaller y values)
		// For coordinate z where z is the "height" of the cone:
		// Let's use standard math coordinates internally for sanity
		// Math x = right (same as p5)
		// Math y = UP (inverted from p5)
		const mathRayY = viewHeight - this.y1;
		const mathConeY = viewHeight - coneY;
		
		const mathPx0 = this.x1 - coneX;
		const mathPz0 = mathRayY - mathConeY; // z is height above apex
		
		const mathDx = rayUx;
		const mathDz = -rayUy; // math mathRayY goes up, p5 y goes down

		// Check if inside cone (must be above apex)
		if (mathPz0 <= 0) return null;
		
		// To be inside the cone, the point's height (mathPz0) must be greater than or equal to 
		// the height of the cone boundary at that x position.
		if (mathPx0 > 0) { // To the right of apex
			if (mathPz0 < pixelRightSlope * mathPx0) return null;
		} else { // To the left of apex
			if (mathPz0 < pixelLeftSlope * -mathPx0) return null;
		}

		let ts = [];
		
		// Right plane (x > 0): z = pixelRightSlope * x
		// mathPz0 + t*mathDz = pixelRightSlope * (mathPx0 + t*mathDx)
		// t * (mathDz - pixelRightSlope * mathDx) = pixelRightSlope * mathPx0 - mathPz0
		const denomR = mathDz - pixelRightSlope * mathDx;
		if (Math.abs(denomR) > 1e-6) {
			const tR = (pixelRightSlope * mathPx0 - mathPz0) / denomR;
			if (tR > 1e-6) {
				// Check if intersection is actually on the right side of apex
				const ix = mathPx0 + tR * mathDx;
				if (ix >= -1e-6) ts.push(tR);
			}
		}

		// Left plane (x < 0): z = pixelLeftSlope * (-x)
		// mathPz0 + t*mathDz = -pixelLeftSlope * (mathPx0 + t*mathDx)
		// t * (mathDz + pixelLeftSlope * mathDx) = -pixelLeftSlope * mathPx0 - mathPz0
		const denomL = mathDz + pixelLeftSlope * mathDx;
		if (Math.abs(denomL) > 1e-6) {
			const tL = (-pixelLeftSlope * mathPx0 - mathPz0) / denomL;
			if (tL > 1e-6) {
				// Check if intersection is actually on the left side of apex
				const ix = mathPx0 + tL * mathDx;
				if (ix <= 1e-6) ts.push(tL);
			}
		}

		if (ts.length === 0) return null;

		const t = Math.min(...ts);
		return {
			x: this.x1 + t * rayUx,
			y: this.y1 + t * rayUy,
			t: t
		};
	}
}

