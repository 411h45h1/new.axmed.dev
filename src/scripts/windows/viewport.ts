const VIEWPORT_KEY = "desktop:viewport:v1";

export function getViewportDimensions() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    timestamp: Date.now(),
  };
}

export function hasViewportChanged() {
  try {
    const stored = localStorage.getItem(VIEWPORT_KEY);
    if (!stored) return false;

    const { width, height } = JSON.parse(stored);
    const current = getViewportDimensions();

    return Math.abs(current.width - width) > 50 || Math.abs(current.height - height) > 50;
  } catch (e) {
    return false;
  }
}

export function storeViewportDimensions() {
  try {
    localStorage.setItem(VIEWPORT_KEY, JSON.stringify(getViewportDimensions()));
  } catch (e) {
    console.warn("Could not store viewport dimensions", e);
  }
}
