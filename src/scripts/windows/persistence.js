import { isMobile } from "./responsive.js";

const LS_KEY = "desktop:windowState:v1";

export function loadState(wins) {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);

    const windowData = data.windows || data;

    wins.forEach((w) => {
      const appId = w.dataset.app;
      if (!windowData[appId]) return;
      const { left, top, width, height, hidden, maximized } = windowData[appId];

      if (isMobile()) {
        if (hidden) {
          w.classList.add("hidden");
        } else {
          w.classList.remove("hidden");
        }
      } else {
        if (left != null) w.style.left = left + "px";
        if (top != null) w.style.top = top + "px";
        if (width != null) w.style.width = width + "px";
        if (height != null) w.style.height = height + "px";
        if (hidden) {
          w.classList.add("hidden");
        } else {
          w.classList.remove("hidden");
        }
        if (maximized) w.classList.add("maximized");
      }
    });
  } catch (e) {
    console.warn("Could not load window state", e);
  }
}

export function readState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_e) {
    return null;
  }
}

export function hasViewportMismatch() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);

    if (!data.viewport) return true;

    const { width: savedWidth, height: savedHeight } = data.viewport;
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;

    const widthDiff = Math.abs(currentWidth - savedWidth);
    const heightDiff = Math.abs(currentHeight - savedHeight);

    const savedAspectRatio = savedWidth / savedHeight;
    const currentAspectRatio = currentWidth / currentHeight;

    const aspectRatioDiff =
      Math.abs(savedAspectRatio - currentAspectRatio) / savedAspectRatio;

    const majorWidthChange = widthDiff > 300;
    const majorHeightChange = heightDiff > 300;
    const majorAspectRatioChange = aspectRatioDiff > 0.4;

    const crossedMajorBreakpoint =
      (savedWidth <= 768 && currentWidth > 1024) ||
      (savedWidth > 1024 && currentWidth <= 768) ||
      (savedWidth <= 1024 && currentWidth > 1440) ||
      (savedWidth > 1440 && currentWidth <= 1024);

    return (
      majorWidthChange ||
      majorHeightChange ||
      majorAspectRatioChange ||
      crossedMajorBreakpoint
    );
  } catch (e) {
    console.warn("Could not check viewport mismatch", e);
    return false;
  }
}

export function saveState(wins) {
  if (typeof window !== "undefined" && window.__SUPPRESS_SAVE__) {
    return;
  }
  try {
    const data = {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        timestamp: Date.now(),
      },
      windows: {},
    };
    wins.forEach((w) => {
      const appId = w.dataset.app;
      data.windows[appId] = {
        left: parseInt(w.style.left) || 0,
        top: parseInt(w.style.top) || 0,
        width: parseInt(w.style.width) || 420,
        height: parseInt(w.style.height) || 280,
        hidden: w.classList.contains("hidden"),
        maximized: w.classList.contains("maximized"),
      };
    });
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Could not save window state", e);
  }
}
