import { params } from './config.js';
import { state } from './state.js';

const STORAGE_KEY = 'coneMapVizState';

// Save all persistent state to local storage
export function saveState() {
  const stateToSave = {
    // Parameters
    heightmapResolution: params.heightmapResolution,
    heightmapScale: params.heightmapScale,
    pointSize: params.pointSize,
    lineWeight: params.lineWeight,
    rayIterations: params.rayIterations,
    heightmapSlopeStart: params.heightmapSlopeStart,
    heightmapSlopeEnd: params.heightmapSlopeEnd,
    heightmapNoisePower: params.heightmapNoisePower,
    
    // UI toggles
    showRay: state.uiState.showRay,
    showConeStepping: state.uiState.showConeStepping,
    showHoveredCone: state.uiState.showHoveredCone,
    coneMode: params.coneMode,
    
    // Ray position
    rayX1: state.ray.x1,
    rayY1: state.ray.y1,
    rayX2: state.ray.x2,
    rayY2: state.ray.y2,
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
}

// Load persistent state from local storage
export function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;
    
    const data = JSON.parse(saved);
    
    // Load parameters
    if (data.heightmapResolution !== undefined) params.heightmapResolution = Math.floor(data.heightmapResolution);
    if (data.heightmapScale !== undefined) params.heightmapScale = data.heightmapScale;
    if (data.pointSize !== undefined) params.pointSize = data.pointSize;
    if (data.lineWeight !== undefined) params.lineWeight = data.lineWeight;
    if (data.rayIterations !== undefined) params.rayIterations = Math.floor(data.rayIterations);
    if (data.heightmapSlopeStart !== undefined) params.heightmapSlopeStart = data.heightmapSlopeStart;
    if (data.heightmapSlopeEnd !== undefined) params.heightmapSlopeEnd = data.heightmapSlopeEnd;
    if (data.heightmapNoisePower !== undefined) params.heightmapNoisePower = data.heightmapNoisePower;
    if (data.coneMode !== undefined) params.coneMode = data.coneMode;
    
    // Load UI toggles
    if (data.showRay !== undefined) state.uiState.showRay = data.showRay;
    if (data.showConeStepping !== undefined) state.uiState.showConeStepping = data.showConeStepping;
    if (data.showHoveredCone !== undefined) state.uiState.showHoveredCone = data.showHoveredCone;
    
    // Load ray position
    if (data.rayX1 !== undefined) state.ray.x1 = data.rayX1;
    if (data.rayY1 !== undefined) state.ray.y1 = data.rayY1;
    if (data.rayX2 !== undefined) state.ray.x2 = data.rayX2;
    if (data.rayY2 !== undefined) state.ray.y2 = data.rayY2;
    
    return true;
  } catch (e) {
    console.error('Failed to load state from localStorage:', e);
    return false;
  }
}

// Clear saved state
export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}
