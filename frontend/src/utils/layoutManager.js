// layoutManager.js - adaptive layout logic for video grid based on participant count
// Supports speaker, gallery, and compact modes

export const LayoutMode = {
  SPEAKER: 'speaker',    // Speaker video large, others in sidebar
  GALLERY: 'gallery',    // Grid of equal-sized tiles
  COMPACT: 'compact'     // Smaller tiles, more participants visible
};

export function getOptimalLayout(participantCount) {
  if (participantCount <= 1) return LayoutMode.SPEAKER;
  if (participantCount <= 4) return LayoutMode.GALLERY;
  return LayoutMode.COMPACT;
}

export function calculateGridLayout(participantCount, containerWidth, containerHeight) {
  const aspectRatio = 16 / 9;
  const padding = 16;
  let cols = 1, rows = 1;

  // Calculate optimal grid dimensions
  if (participantCount <= 2) { cols = 1; rows = participantCount; }
  else if (participantCount <= 4) { cols = 2; rows = 2; }
  else if (participantCount <= 6) { cols = 3; rows = 2; }
  else if (participantCount <= 9) { cols = 3; rows = 3; }
  else if (participantCount <= 12) { cols = 4; rows = 3; }
  else { cols = 4; rows = Math.ceil(participantCount / 4); }

  const tileWidth = (containerWidth - (cols + 1) * padding) / cols;
  const tileHeight = tileWidth / aspectRatio;

  return { cols, rows, tileWidth, tileHeight };
}

export function getLayoutStyle(mode, index, participantCount, isLocalUser = false) {
  if (mode === LayoutMode.SPEAKER) {
    if (isLocalUser || index === 0) {
      return { gridColumn: '1 / -1', gridRow: '1 / 3', zIndex: 10 };
    }
    return { zIndex: 5 };
  }
  return {}; // Gallery/compact use default grid
}
