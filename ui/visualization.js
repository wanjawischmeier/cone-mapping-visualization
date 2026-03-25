// ============================================================================
// VISUALIZATION
// ============================================================================
function drawHeightmapVisualization() {
  if (heightmap === undefined) {
    fill(150);
    textAlign(CENTER, CENTER);
    text("Generate a heightmap to start", params.canvasWidth / 2 - params.uiPanelWidth, params.canvasHeight / 2);
    return;
  }

  const viewHeight = params.canvasHeight - 2 * params.sideViewPadding;
  const viewWidth = params.canvasWidth - params.uiPanelWidth - 2 * params.sideViewPadding;
  const pointSpacing = viewWidth / (heightmap.length - 1);

  // Draw background for visualization area
  fill(255);
  stroke(200);
  strokeWeight(1);
  rect(params.sideViewPadding, params.sideViewPadding, viewWidth, viewHeight);

  // Draw iteration slider at top
  drawIterationSlider();

  // Draw heightmap profile (side view)
  drawHeightmapProfile(pointSpacing, viewHeight);

  // Draw height field points at bottom with color corresponding to height
  drawHeightmapPoints(pointSpacing, viewHeight);

  // Update hovered index based on closest x-wise point in entire visualization
  updateHoveredIndexFromMouse(pointSpacing, viewHeight, viewWidth);

  // Draw ray if enabled
  if (uiState.showRay) {
    drawRay(params.sideViewPadding, params.sideViewPadding, viewWidth, viewHeight);
    // Draw ray stepping visualization if enabled
    if (uiState.showConeStepping) {
      drawRayStepping(pointSpacing, viewHeight, viewWidth);
    }
  }

  // Draw cone visualization and intersections if hovering
  if (coneMap !== undefined && hoveredIndex >= 0 && uiState.showHoveredCone) {
    rayIntersections = ray.getIntersectionsWithCone(coneMap[hoveredIndex], pointSpacing, viewHeight, params.sideViewPadding);

    drawHoveredCone(pointSpacing, viewHeight, viewWidth);

    // Always draw ray-cone intersections
    drawRayIntersections();
  }

  function updateHoveredIndexFromMouse(pointSpacing, viewHeight, viewWidth) {
    // Account for the UI panel offset (already translated, so relative to visualization area)
    const adjustedMouseX = mouseX - params.uiPanelWidth;

    // Find closest point x-wise within the visualization area
    const minX = params.sideViewPadding;
    const maxX = params.sideViewPadding + viewWidth;

    hoveredIndex = -1;
    let closestDist = Infinity;

    for (let i = 0; i < heightmap.length; i++) {
      const ptX = params.sideViewPadding + i * pointSpacing;
      const dist = Math.abs(adjustedMouseX - ptX);

      if (dist < closestDist && adjustedMouseX >= minX && adjustedMouseX <= maxX) {
        closestDist = dist;
        hoveredIndex = i;
      }
    }
  }
}