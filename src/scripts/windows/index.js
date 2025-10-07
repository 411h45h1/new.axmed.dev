import { isMobile, isTablet } from "./responsive.js";
import { hasViewportChanged, storeViewportDimensions } from "./viewport.js";
import {
  calculateCenteredPositions,
  smartDistributeWindows,
  applyCenteredPositions,
  applySmartLayout,
} from "./layout.js";
import {
  loadState,
  saveState,
  readState,
  hasViewportMismatch,
} from "./persistence.js";

const STATE_EVENT = "windows:statechange";

if (typeof window !== "undefined") {
  if (!window.__WINDOWS_INITED__) {
    window.__WINDOWS_INITED__ = false;
  }
}

export function initWindows() {
  if (typeof window !== "undefined" && window.__WINDOWS_INITED__) {
    return;
  }
  if (typeof window !== "undefined") window.__WINDOWS_INITED__ = true;

  const wins = Array.from(document.querySelectorAll(".window"));
  wins.forEach((w) => w.classList.add("pre-center"));

  if (!isMobile()) {
    wins.forEach((w) => w.classList.add("boot-in"));
    setTimeout(() => wins.forEach((w) => w.classList.remove("boot-in")), 520);
  }

  let zCounter = 100;

  wins.forEach((w, index) => {
    w.style.zIndex = zCounter + index;
  });
  zCounter += wins.length;

  function focus(win) {
    wins.forEach((w) => w.classList.remove("focused"));
    win.classList.add("focused");
    win.style.zIndex = ++zCounter;
  }

  if (isMobile()) {
    wins.forEach((w) => {
      w.classList.add("hidden");
    });
  } else {
    const firstVisibleWindow = wins.find(
      (w) => !w.classList.contains("hidden")
    );
    if (firstVisibleWindow) {
      focus(firstVisibleWindow);
    }
  }

  function ensureWindowsRespectMenubar() {
    const menubarHeight =
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--menubar-height"
        )
      ) || 28;

    wins.forEach((w) => {
      if (!w.classList.contains("hidden") && !isMobile()) {
        const rect = w.getBoundingClientRect();
        if (rect.top < menubarHeight) {
          w.style.top = menubarHeight + 10 + "px";
        }
      }
    });
  }

  function toggleMaximize(win) {
    const goingMax = !win.classList.contains("maximized");
    if (goingMax) {
      win.dataset.prevInline = win.getAttribute("style") || "";
      win.style.removeProperty("left");
      win.style.removeProperty("top");
      win.style.removeProperty("width");
      win.style.removeProperty("height");
      win.classList.add("maximized");
      focus(win);
      saveState(wins);
    } else {
      win.classList.remove("maximized");
      if (!isMobile()) {
        const prev = win.dataset.prevInline || "";
        win.setAttribute("style", prev);
      }
      focus(win);
      saveState(wins);
    }
  }

  window.__ensureWindowsRespectMenubar = ensureWindowsRespectMenubar;
  window.__toggleMaximize = toggleMaximize;

  const stateData = readState();
  let hasSavedState = !!stateData;
  if (!hasSavedState) {
    try {
      hasSavedState = !!localStorage.getItem("desktop:windowState:v1");
    } catch (e) {
      hasSavedState = wins.some((w) => {
        const style = w.getAttribute("style") || "";
        return style.includes("left") || style.includes("top");
      });
    }
  }

  if (!hasSavedState) {
    if (isMobile()) {
      wins.forEach((w) => {
        const appId = w.dataset.app;
        if (appId === "about") {
          w.classList.remove("hidden");
          focus(w);
          const menubar = document.getElementById("menubar");
          if (menubar) {
            const title = w.querySelector(".title")?.textContent || "";
            menubar.setAttribute("data-screen-title", title);
          }
        } else {
          w.classList.add("hidden");
        }
      });
      wins.forEach((w) => w.classList.remove("pre-center"));
      saveState(wins);
    } else {
      let defaultWindows;
      const viewportWidth = window.innerWidth;

      if (isTablet()) {
        defaultWindows = ["about", "projects", "experience"];
      } else if (viewportWidth >= 1440) {
        defaultWindows = [
          "about",
          "projects",
          "experience",
          "skills",
          "contact",
        ];
      } else {
        defaultWindows = ["about", "projects", "skills", "contact"];
      }

      wins.forEach((w) => {
        const initialStyle = w.getAttribute("style");
        if (initialStyle && !w.getAttribute("data-original-style")) {
          w.setAttribute("data-original-style", initialStyle);
        }
      });

      wins.forEach((w) => {
        const appId = w.dataset.app;
        if (defaultWindows.includes(appId)) {
          w.classList.remove("hidden");
        } else {
          w.classList.add("hidden");
        }
      });

      setTimeout(() => {
        const layout = smartDistributeWindows(wins);
        if (layout) {
          applySmartLayout(layout);
          wins.forEach((w) => {
            const currentStyle = w.getAttribute("style");
            if (currentStyle) {
              w.setAttribute("data-original-style", currentStyle);
            }
          });
        } else {
          const centered = calculateCenteredPositions(wins);
          if (centered) {
            applyCenteredPositions(centered);
            centered.windowData.forEach(({ w }) => {
              const currentStyle = w.getAttribute("style");
              if (currentStyle) {
                w.setAttribute("data-original-style", currentStyle);
              }
            });
          }
        }

        const firstVisible = wins.find((w) => !w.classList.contains("hidden"));
        if (firstVisible) {
          focus(firstVisible);
        }

        saveState(wins);
        wins.forEach((w) => w.classList.remove("pre-center"));
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent("windows:statechange"));
        }, 50);
      }, 220);
    }
  } else {
    const viewportMismatch = hasViewportMismatch();

    if (viewportMismatch) {
      if (isMobile()) {
        wins.forEach((w) => {
          const appId = w.dataset.app;
          if (appId === "about") {
            w.classList.remove("hidden");
          } else {
            w.classList.add("hidden");
          }
          w.style.removeProperty("left");
          w.style.removeProperty("top");
          w.style.removeProperty("width");
          w.style.removeProperty("height");
          w.classList.remove("maximized");
        });
        wins.forEach((w) => w.classList.remove("pre-center"));
        saveState(wins);
      } else {
        let defaultWindows;
        const viewportWidth = window.innerWidth;

        if (isTablet()) {
          defaultWindows = ["about", "experience"];
        } else if (viewportWidth >= 1440) {
          defaultWindows = ["about", "experience", "projects"];
        } else {
          defaultWindows = ["about", "experience"];
        }

        wins.forEach((w) => {
          const appId = w.dataset.app;
          w.classList.remove("maximized");
          if (defaultWindows.includes(appId)) {
            w.classList.remove("hidden");
          } else {
            w.classList.add("hidden");
          }
        });

        wins.forEach((w) => {
          const currentStyle = w.getAttribute("style");
          if (currentStyle) {
            w.setAttribute("data-original-style", currentStyle);
          }
        });

        setTimeout(() => {
          const smart = smartDistributeWindows(wins);
          if (smart) {
            applySmartLayout(smart);
            wins.forEach((w) => {
              const currentStyle = w.getAttribute("style");
              if (currentStyle) {
                w.setAttribute("data-original-style", currentStyle);
              }
            });
            wins.forEach((w) => w.classList.remove("pre-center"));
            saveState(wins);
            setTimeout(() => {
              document.dispatchEvent(new CustomEvent("windows:statechange"));
            }, 50);
            return;
          }

          const newPositions = calculateCenteredPositions(wins);
          if (newPositions) {
            applyCenteredPositions(newPositions);
            wins.forEach((w) => {
              const currentStyle = w.getAttribute("style");
              if (currentStyle) {
                w.setAttribute("data-original-style", currentStyle);
              }
            });
          }
          wins.forEach((w) => w.classList.remove("pre-center"));
          saveState(wins);
          setTimeout(() => {
            document.dispatchEvent(new CustomEvent("windows:statechange"));
          }, 50);
        }, 220);
      }
    } else {
      loadState(wins);

      if (!isMobile()) {
        wins.forEach((w) => {
          const currentStyle = w.getAttribute("style");
          if (currentStyle) {
            w.setAttribute("data-original-style", currentStyle);
          }
        });
      } else {
        const visibleWindow = wins.find((w) => !w.classList.contains("hidden"));
        if (visibleWindow) {
          const menubar = document.getElementById("menubar");
          if (menubar) {
            const title =
              visibleWindow.querySelector(".title")?.textContent || "";
            menubar.setAttribute("data-screen-title", title);
          }
        } else {
          const aboutWindow = wins.find((w) => w.dataset.app === "about");
          if (aboutWindow) {
            aboutWindow.classList.remove("hidden");
            focus(aboutWindow);
            const menubar = document.getElementById("menubar");
            if (menubar) {
              const title =
                aboutWindow.querySelector(".title")?.textContent || "";
              menubar.setAttribute("data-screen-title", title);
            }
            saveState(wins);
          }
        }
      }
    }

    const firstVisible = wins.find((w) => !w.classList.contains("hidden"));
    if (firstVisible) {
      focus(firstVisible);
    }

    wins.forEach((w) => w.classList.remove("pre-center"));
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent("windows:statechange"));
    }, 50);
  }
  if (hasViewportChanged()) {
    document.dispatchEvent(new CustomEvent("viewport:changed"));
  }

  storeViewportDimensions();
  setTimeout(ensureWindowsRespectMenubar, 100);

  document.addEventListener("windows:recenter", () => {
    const smart = smartDistributeWindows(wins);
    if (smart) {
      applySmartLayout(smart);
      wins.forEach((w) => {
        const currentStyle = w.getAttribute("style");
        if (currentStyle) {
          w.setAttribute("data-original-style", currentStyle);
        }
      });
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent("windows:statechange"));

        if (window.saveState) {
          window.saveState(wins);
        }
      }, 50);
      return;
    }
    const newPositions = calculateCenteredPositions(wins);
    if (newPositions) {
      applyCenteredPositions(newPositions);
      newPositions.windowData.forEach(({ w }) => {
        const currentStyle = w.getAttribute("style");
        w.setAttribute("data-original-style", currentStyle);
      });
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent("windows:statechange"));

        if (window.saveState) {
          window.saveState(wins);
        }
      }, 50);
    }
  });

  let resizeTimer;
  let previousDeviceType = isMobile()
    ? "mobile"
    : isTablet()
    ? "tablet"
    : "desktop";

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {
      const currentDeviceType = isMobile()
        ? "mobile"
        : isTablet()
        ? "tablet"
        : "desktop";
      const deviceTypeChanged = currentDeviceType !== previousDeviceType;
      const viewportChanged = hasViewportChanged();

      if (viewportChanged) {
        document.dispatchEvent(new CustomEvent("viewport:changed"));
        storeViewportDimensions();
      }

      if (deviceTypeChanged) {
        previousDeviceType = currentDeviceType;
        document.dispatchEvent(new CustomEvent("windows:recenter"));
      } else if (viewportChanged && !isMobile()) {
        document.dispatchEvent(new CustomEvent("windows:recenter"));
      }

      if (isMobile()) {
        wins.forEach((w) => {
          if (w.classList.contains("hidden")) return;
          w.style.removeProperty("left");
          w.style.removeProperty("top");
          w.style.removeProperty("width");
          w.style.removeProperty("height");
        });
      }
    }, 250);
  });

  function emitState() {
    document.dispatchEvent(new CustomEvent(STATE_EVENT));
  }
  wins.forEach((win) => {
    const titlebar = win.querySelector(".titlebar");
    let dragging = false,
      startX = 0,
      startY = 0,
      origX = 0,
      origY = 0;

    if (isMobile()) {
      return;
    }

    titlebar.addEventListener("mousedown", (e) => {
      if (e.target.closest(".window-button")) return;
      if (win.classList.contains("maximized")) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = win.getBoundingClientRect();
      origX = rect.left;
      origY = rect.top;
      focus(win);
      win.classList.add("interacting");
      e.preventDefault();
    });
    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX,
        dy = e.clientY - startY;
      let nx = origX + dx,
        ny = origY + dy;
      const margin = 40;
      const menubarHeight =
        parseInt(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--menubar-height"
          )
        ) || 28;

      nx = Math.min(
        window.innerWidth - margin,
        Math.max(-(win.getBoundingClientRect().width - margin), nx)
      );
      ny = Math.min(window.innerHeight - margin, Math.max(menubarHeight, ny));

      win.style.left = nx + "px";
      win.style.top = ny + "px";
    });
    window.addEventListener("mouseup", () => {
      dragging = false;
      win.classList.remove("interacting");
    });
    titlebar.addEventListener("dblclick", () => toggleMaximize(win));
  });

  wins.forEach((win) => {
    if (isMobile()) {
      return;
    }

    const resizeElements = win.querySelectorAll(
      ".window-resizer, .window-resizer-corner, .window-resizer-edge"
    );

    let resizing = false;
    let resizeMode = null;
    let startX = 0,
      startY = 0,
      startW = 0,
      startH = 0,
      startLeft = 0,
      startTop = 0;

    resizeElements.forEach((resizer) => {
      resizer.addEventListener("mousedown", (e) => {
        if (win.classList.contains("maximized")) return;
        resizing = true;
        resizeMode = resizer.dataset.resize || "bottom-right";
        startX = e.clientX;
        startY = e.clientY;
        const r = win.getBoundingClientRect();
        startW = r.width;
        startH = r.height;
        startLeft = r.left;
        startTop = r.top;
        focus(win);
        win.classList.add("interacting");
        e.preventDefault();
        e.stopPropagation();
      });
    });

    window.addEventListener("mousemove", (e) => {
      if (!resizing) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const menubarHeight =
        parseInt(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--menubar-height"
          )
        ) || 28;
      const dockHeight =
        parseInt(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--dock-height"
          )
        ) || 84;

      let newWidth = startW;
      let newHeight = startH;
      let newLeft = startLeft;
      let newTop = startTop;

      switch (resizeMode) {
        case "bottom-right":
          newWidth = startW + dx;
          newHeight = startH + dy;
          break;
        case "bottom-left":
          newWidth = startW - dx;
          newHeight = startH + dy;
          newLeft = startLeft + dx;
          break;
        case "top-right":
          newWidth = startW + dx;
          newHeight = startH - dy;
          newTop = startTop + dy;
          break;
        case "top-left":
          newWidth = startW - dx;
          newHeight = startH - dy;
          newLeft = startLeft + dx;
          newTop = startTop + dy;
          break;
        case "right":
          newWidth = startW + dx;
          break;
        case "left":
          newWidth = startW - dx;
          newLeft = startLeft + dx;
          break;
        case "bottom":
          newHeight = startH + dy;
          break;
        case "top":
          newHeight = startH - dy;
          newTop = startTop + dy;
          break;
      }

      const minWidth = 240;
      const minHeight = 140;

      if (resizeMode.includes("left")) {
        const maxWidth = startLeft + startW - 40;
        newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
        newLeft = startLeft + startW - newWidth;
      } else if (resizeMode.includes("right") || resizeMode === "right") {
        const maxWidth = window.innerWidth - startLeft - 20;
        newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
      }

      if (resizeMode.includes("top")) {
        const maxHeight = startTop + startH - menubarHeight - 40;
        newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
        newTop = startTop + startH - newHeight;
        newTop = Math.max(menubarHeight, newTop);
      } else if (resizeMode.includes("bottom") || resizeMode === "bottom") {
        const maxHeight = window.innerHeight - dockHeight - startTop - 20;
        newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
      }

      win.style.width = newWidth + "px";
      win.style.height = newHeight + "px";

      if (resizeMode.includes("left") || resizeMode === "left") {
        win.style.left = newLeft + "px";
      }
      if (resizeMode.includes("top") || resizeMode === "top") {
        win.style.top = newTop + "px";
      }
    });

    window.addEventListener("mouseup", () => {
      if (resizing) {
        resizing = false;
        resizeMode = null;
        win.classList.remove("interacting");
      }
    });
  });

  document.querySelectorAll(".window-button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const win = btn.closest(".window");
      const action = btn.dataset.action;
      switch (action) {
        case "close":
          win.classList.add("hidden");
          saveState(wins);
          document.dispatchEvent(new CustomEvent("viewport:changed"));
          break;
        case "minimize":
          if (!win.classList.contains("hidden")) {
            playMinimize(win, () => {
              win.classList.add("hidden");
              document.dispatchEvent(new CustomEvent("viewport:changed"));
              emitState();
            });
          }
          return emitState();
        case "maximize":
          toggleMaximize(win);
          break;
      }
      emitState();
      e.stopPropagation();
    });
  });

  document.addEventListener("click", (e) => {
    const w = e.target.closest(".window");
    if (w) focus(w);
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const focused = document.querySelector(".window.focused.maximized");
      if (focused) toggleMaximize(focused);
    }
  });

  function playMinimize(win, done) {
    const app = win.dataset.app;
    const dockItem = document.querySelector(`.dock-item[data-app="${app}"]`);
    if (!dockItem) {
      win.classList.add("minimized");
      setTimeout(() => {
        done();
        win.classList.remove("minimized");
        saveState(wins);
      }, 360);
      return;
    }
    const wRect = win.getBoundingClientRect();
    const dRect = dockItem.getBoundingClientRect();
    const toX = dRect.left + dRect.width / 2 - (wRect.left + wRect.width / 2);
    const toY = dRect.top + dRect.height / 2 - (wRect.top + wRect.height / 2);
    win.style.transformOrigin = "center center";
    win.style.transition =
      "transform 360ms cubic-bezier(.4,.8,.2,1), opacity 360ms";
    requestAnimationFrame(() => {
      win.style.transform = `translate(${toX}px, ${toY}px) scale(.25)`;
      win.style.opacity = "0";
    });
    const clear = () => {
      win.style.transition = "";
      win.style.transform = "";
      win.style.opacity = "";
      win.removeEventListener("transitionend", clear);
      done();
      saveState(wins);
    };
    win.addEventListener("transitionend", clear);
  }

  ["mouseup", "mouseleave"].forEach((ev) =>
    window.addEventListener(ev, () => saveState(wins))
  );

  window.saveState = (windows) => saveState(windows || wins);

  return { focus, toggleMaximize, emitState };
}
