(function initMenuBar() {
  const bar = document.getElementById("menubar");
  if (!bar) return;
  const items = Array.from(bar.querySelectorAll<HTMLElement>(".menu-item[data-app]"));
  const leftMenu = bar.querySelector<HTMLElement>(".left");
  const resetBtn = document.getElementById("reset-windows-btn");

  const initialWindowStyles = new Map<string, string>();
  const initialVisibility = new Map<string, boolean>();
  let viewportChanged = false;

  function storeInitialStyles() {
    const wins = document.querySelectorAll<HTMLElement>(".window");
    wins.forEach((win) => {
      const appId = win.dataset.app;
      if (!appId || initialWindowStyles.has(appId)) return;
      const initialStyle = win.getAttribute("style") || "";
      const isVisible = !win.classList.contains("hidden");
      initialWindowStyles.set(appId, initialStyle);
      initialVisibility.set(appId, isVisible);
    });
  }

  let initialStylesStored = false;
  document.addEventListener("windows:statechange", () => {
    if (!initialStylesStored) {
      storeInitialStyles();
      initialStylesStored = true;
    }
  });

  function normalizeStyle(style: string | null | undefined) {
    if (!style) return "";
    return style
      .replace(/z-index:\s*\d+;?/g, "")
      .replace(/;\s*;/g, ";")
      .replace(/;\s*$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function checkWindowsModified() {
    if (!resetBtn) return;

    const wins = document.querySelectorAll<HTMLElement>(".window");
    let isModified = false;
    let allWindowsHaveOriginalStyle = true;
    let visibilityChanged = false;

    for (const win of wins) {
      const appId = win.dataset.app;
      if (!appId) continue;
      const currentStyle = win.getAttribute("style") || "";
      const originalStyle = win.getAttribute("data-original-style") || "";

      if (!originalStyle) {
        allWindowsHaveOriginalStyle = false;
        continue;
      }

      const normalizedCurrent = normalizeStyle(currentStyle);
      const normalizedOriginal = normalizeStyle(originalStyle);

      if (normalizedCurrent !== normalizedOriginal) {
        isModified = true;
        break;
      }
    }

    if (initialVisibility.size > 0) {
      for (const win of wins) {
        const appId = win.dataset.app;
        if (!appId) continue;
        const currentlyVisible = !win.classList.contains("hidden");
        const initiallyVisible = initialVisibility.get(appId);

        if (initiallyVisible !== undefined && currentlyVisible !== initiallyVisible) {
          visibilityChanged = true;
          break;
        }
      }
    }

    if (!allWindowsHaveOriginalStyle) {
      resetBtn.classList.remove("faded");
      return true;
    }

    if (isModified || viewportChanged || visibilityChanged) {
      resetBtn.classList.remove("faded");
    } else {
      resetBtn.classList.add("faded");
    }

    return isModified || viewportChanged || visibilityChanged;
  }

  function resetWindows() {
    const wins = document.querySelectorAll(".window");

    const successWindow = document.querySelector('.window[data-app="success"]');
    if (successWindow && !successWindow.classList.contains("hidden")) {
      successWindow.classList.add("hidden");
    }

    wins.forEach((win) => {
      const appId = (win as HTMLElement).dataset.app;
      if (!appId) return;
      const originalHtmlStyle = initialWindowStyles.get(appId);

      if (originalHtmlStyle) {
        win.classList.remove("maximized");
        win.setAttribute("style", originalHtmlStyle);
        win.removeAttribute("data-original-style");
      }
    });

    document.dispatchEvent(new CustomEvent("windows:recenter"));

    localStorage.removeItem("desktop:windowState:v1");
    localStorage.removeItem("desktop:viewport:v1");

    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem("desktop:viewport:v1", JSON.stringify(viewport));
    } catch (e) {
      console.warn("Could not store viewport dimensions", e);
    }

    viewportChanged = false;

    setTimeout(() => {
      initialWindowStyles.clear();
      initialVisibility.clear();
      storeInitialStyles();

      const windowsToSave = Array.from(document.querySelectorAll(".window")) as HTMLElement[];
      const data = {};
      windowsToSave.forEach((w) => {
        const appId = w.dataset.app;
        if (!appId) return;
        data[appId] = {
          left: parseInt(w.style.left) || 0,
          top: parseInt(w.style.top) || 0,
          width: parseInt(w.style.width) || 420,
          height: parseInt(w.style.height) || 280,
          hidden: w.classList.contains("hidden"),
          maximized: w.classList.contains("maximized"),
        };
      });
      try {
        localStorage.setItem("desktop:windowState:v1", JSON.stringify(data));
      } catch (e) {
        console.warn("Could not save window state after reset", e);
      }

      checkWindowsModified();
    }, 150);

    document.dispatchEvent(new CustomEvent("windows:statechange"));
  }

  document.addEventListener("viewport:changed", () => {
    viewportChanged = true;
    checkWindowsModified();
  });

  setTimeout(() => {
    checkWindowsModified();
  }, 300);

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (!resetBtn.classList.contains("faded")) {
        resetWindows();
      }
    });

    resetBtn.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && !resetBtn.classList.contains("faded")) {
        e.preventDefault();
        resetWindows();
      }
    });
  }

  const observer = new MutationObserver(() => {
    checkWindowsModified();
  });

  setTimeout(() => {
    const wins = document.querySelectorAll(".window");
    wins.forEach((win) => {
      observer.observe(win, {
        attributes: true,
        attributeFilter: ["style", "class"],
      });
    });
  }, 300);

  document.addEventListener("windows:statechange", checkWindowsModified);

  function initMobileMenu() {
    if (!bar || window.innerWidth > 767) return;

    bar.addEventListener("click", (e) => {
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      if (e.clientX - rect.left < 60 && e.clientY - rect.top < rect.height) {
        if (leftMenu) {
          leftMenu.classList.toggle("menu-open");
        }
      }
    });

    items.forEach((item) => {
      item.addEventListener("click", () => {
        if (leftMenu) {
          leftMenu.classList.remove("menu-open");
        }
      });
    });

    document.addEventListener("click", (e) => {
      const target = e.target as Node | null;
      if (
        leftMenu &&
        leftMenu.classList.contains("menu-open") &&
        bar &&
        target &&
        !bar.contains(target)
      ) {
        leftMenu.classList.remove("menu-open");
      }
    });
  }

  function getWindow(app: string | undefined) {
    return document.querySelector(`.window[data-app="${app}"]`) as HTMLElement | null;
  }
  function focusWindow(win: HTMLElement | null) {
    if (!win) return;
    win.dispatchEvent(new Event("click", { bubbles: true }));
  }
  function maximizeWindow(win: HTMLElement | null) {
    if (!win) return;
    const btn = win.querySelector(".window-button.maximize") as HTMLElement | null;
    if (btn) btn.click();
  }
  function restoreIfHidden(win: HTMLElement) {
    if (win.classList.contains("hidden")) {
      win.classList.remove("hidden");
    }
  }

  items.forEach((item) => {
    let lastClickTime = 0;
    item.addEventListener("click", (_e) => {
      const app = item.dataset.app;
      const win = getWindow(app);
      if (!win) return;
      const now = performance.now();
      const delta = now - lastClickTime;
      lastClickTime = now;

      if (window.innerWidth <= 767) {
        const allWindows = document.querySelectorAll(".window");
        allWindows.forEach((w) => {
          if (w !== win) {
            w.classList.add("hidden");
          }
        });
        win.classList.remove("hidden");
        focusWindow(win);

        const title = win.querySelector(".title")?.textContent || "";
        bar.setAttribute("data-screen-title", title);

        if (leftMenu) {
          leftMenu.classList.remove("menu-open");
        }
      } else {
        const wasHidden = win.classList.contains("hidden");
        restoreIfHidden(win);
        if (delta < 350) {
          maximizeWindow(win);
        } else {
          focusWindow(win);
        }
        if (window.__ensureWindowsRespectMenubar) {
          setTimeout(() => window.__ensureWindowsRespectMenubar?.(), 0);
        }
        if (wasHidden) {
          document.dispatchEvent(new CustomEvent("windows:recenter"));
        }
      }
    });

    item.addEventListener("keydown", (e) => {
      const keyEvent = e as KeyboardEvent;
      if (keyEvent.key === "Enter" || keyEvent.key === " ") {
        e.preventDefault();
        item.click();
      }
      if (keyEvent.key === "ArrowDown") {
        const win = getWindow(item.dataset.app);
        if (win) {
          const content = win.querySelector<HTMLElement>(".window-content");
          content?.focus?.();
        }
      }
    });
  });

  initMobileMenu();

  if (window.innerWidth <= 767) {
    setTimeout(() => {
      const visibleWindow = document.querySelector(".window:not(.hidden)");
      if (visibleWindow) {
        const title = visibleWindow.querySelector(".title")?.textContent || "";
        bar.setAttribute("data-screen-title", title);
      }
    }, 100);
  }

  let resizeTimer: ReturnType<typeof setTimeout>;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth > 767 && leftMenu) {
        leftMenu.classList.remove("menu-open");
      }
    }, 250);
  });
})();
