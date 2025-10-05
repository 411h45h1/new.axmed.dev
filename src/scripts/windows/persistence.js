import { isMobile } from "./responsive.js";

const LS_KEY = "desktop:windowState:v1";

export function loadState(wins) {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);

    wins.forEach((w) => {
      const appId = w.dataset.app;
      if (!data[appId]) return;
      const { left, top, width, height, hidden, maximized } = data[appId];

      if (isMobile()) {
        if (appId === "about") {
          w.classList.remove("hidden");
        } else {
          w.classList.add("hidden");
        }
      } else {
        if (left != null) w.style.left = left + "px";
        if (top != null) w.style.top = top + "px";
        if (width != null) w.style.width = width + "px";
        if (height != null) w.style.height = height + "px";
        if (hidden) w.classList.add("hidden");
        if (maximized) w.classList.add("maximized");
      }
    });
  } catch (e) {
    console.warn("Could not load window state", e);
  }
}

export function saveState(wins) {
  try {
    const data = {};
    wins.forEach((w) => {
      const appId = w.dataset.app;
      data[appId] = {
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
