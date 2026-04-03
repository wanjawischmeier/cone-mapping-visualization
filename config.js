export const defaultParams = {
	uiPanelWidth: 220,
	heightmapResolution: 25,
	heightmapScale: 75,
	pointSize: 8,
	lineWeight: 2,
	sideViewPadding: 50,
	coneColorIntensity: 0.5,
	rayIterations: 10,
	binarySearchSteps: 5,
	heightmapSlopeStart: 0.7,
	heightmapSlopeEnd: 0.0,
	heightmapNoisePower: 0.3,
	heightmapNoiseScale: 0.1,
	coneMode: 'anisotropic', // 'isotropic' or 'anisotropic'
	coneGenerationMode: 'conservative', // 'conservative' or 'exactRelaxed'
	applyBilinearFix: true, // Apply post-process bilinear fix for robust stepping
};

// UI/UX Color Palette
export const colors = {
	// Panel & Background
	panelBackground: 220,
	panelBorder: 100,
	
	// Text
	text: 0,
	textDisabled: 150,
	
	// Buttons
	buttonDisabledBackground: 180,
	buttonDisabledBorder: 120,
	buttonDefaultBackground: 150,
	buttonHoverBackground: 100,
	buttonBorder: 50,
	buttonText: 255,
	buttonTextDisabled: 150,
	
	// Checkbox
	checkboxDisabledBackground: 200,
	checkboxDisabledBorder: 150,
	checkboxCheckedBackground: 100,
	checkboxUncheckedBackground: 255,
	checkboxBorder: 50,
	checkboxCheckmark: 255,
	
	// Slider
	sliderBackground: 200,
	sliderBorder: 100,
	sliderThumb: 100,
	
	// Heightmap Visualization
	heightmapGrid: 0,
	heightmapStepFill: 150,
	heightmapLinesFill: 255,
	heightmapLinesStroke: 200,
	
	// Cone Stepping Colors
	coneStepPoint: [150, 150, 255],		// Blue
	coneSavePoint: [100, 255, 100],		// Green
	coneFailPoint: [255, 100, 100],		// Red
	coneCurrentPoint: [200, 100, 200],	// Purple/Magenta
	coneSavePointAlpha75: [100, 255, 100, 75],
	coneFailPointAlpha75: [255, 100, 100, 75],
	coneCurrentPointAlpha75: [200, 100, 200, 75],
	coneSavePointAlpha80: [100, 255, 100, 80],
	coneFailPointAlpha80: [255, 100, 100, 80],
	coneSavePointAlpha50: [100, 255, 100, 50],
	
	// Cone Visualization
	coneDefault: [100, 150, 255],			// Blue
	coneHovered: [255, 165, 100],			// Orange
	
	// Tumbling Windows visualization
	tumblingWindowLine: [100, 120, 255, 200],		// Blue line
	tumblingWindowMarker: [100, 120, 255, 255],	// Blue end markers
	tumblingWindowMax: [255, 100, 100],				// Light red for window max
	tumblingGlobalMax: [255, 0, 0],					// Red for global max
	tumblingGlobalMaxStroke: [255, 0, 0],			// Red stroke for global max cross
	tumblingAllTogetherMax: [255, 255, 0],			// Yellow for all-together max
	tumblingAllTogetherMaxCone: [255, 255, 0, 150],	// Yellow semi-transparent for cone
	
	// Ray/Sketcher visualization (sketch2.js)
	rayLine: [100, 200, 255],
	rayLineSemiTransparent: [100, 200, 255, 40],
	rayEndpoint: [255, 255, 255],
	rayEndpointAlpha: [255, 255, 255, 150],
	rayExtensionStart: [255, 200, 100, 120],
	coneStatus: {
		safe: [0, 150, 0],				// Green
		unsafe: [150, 0, 0],			// Red
	}
};

export let params = {
	get canvasWidth() {
		return window.innerWidth;
	},
	get canvasHeight() {
		return window.innerHeight;
	},
	...defaultParams,
};
