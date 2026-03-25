export let params = {
  get canvasWidth() {
    return window.innerWidth;
  },
  get canvasHeight() {
    return window.innerHeight;
  },
  uiPanelWidth: 220,
  heightmapResolution: 25,
  heightmapScale: 75,
  pointSize: 8,
  lineWeight: 2,
  sideViewPadding: 50,
  coneColorIntensity: 0.5,
  rayIterations: 10,
  heightmapSlopeStart: 0.7,
  heightmapSlopeEnd: 0.0,
  heightmapNoisePower: 0.3,
  coneMode: 'anisotropic', // 'isotropic' or 'anisotropic'
};
