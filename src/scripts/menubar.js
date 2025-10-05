(function initMenuBar() {
  const bar = document.getElementById("menubar");
  if (!bar) return;
  const items = Array.from(bar.querySelectorAll(".menu-item[data-app]"));
  const leftMenu = bar.querySelector(".left");
  const resetBtn = document.getElementById("reset-windows-btn");

  const initialWindowStyles = new Map();
  let viewportChanged = false;

  function storeInitialStyles() {
    const wins = document.querySelectorAll(".window");
    wins.forEach((win) => {
      const appId = win.dataset.app;
      if (!initialWindowStyles.has(appId)) {
        const initialStyle = win.getAttribute("style") || "";
        initialWindowStyles.set(appId, initialStyle);
      }
    });
  }

  let initialStylesStored = false;
  document.addEventListener("windows:statechange", () => {
    if (!initialStylesStored) {
      storeInitialStyles();
      initialStylesStored = true;
    }
  });

  function normalizeStyle(style) {
    if (!style) return "";
    return style
      .replace(/z-index:\s*\d+;?/g, "")
      .replace(/;\s*;/g, ";")
      .replace(/;\s*$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function checkWindowsModified() {
    if (!resetBtn) return false;

    const wins = document.querySelectorAll(".window");
    let isModified = false;

    for (const win of wins) {
      const _appId = win.dataset.app;
      const currentStyle = win.getAttribute("style") || "";
      const originalStyle = win.getAttribute("data-original-style") || "";

      if (!originalStyle) {
        continue;
      }

      const normalizedCurrent = normalizeStyle(currentStyle);
      const normalizedOriginal = normalizeStyle(originalStyle);

      if (normalizedCurrent !== normalizedOriginal) {
        isModified = true;
        break;
      }
    }

    if (isModified || viewportChanged) {
      resetBtn.classList.remove("faded");
    } else {
      resetBtn.classList.add("faded");
    }

    return isModified || viewportChanged;
  }

  function resetWindows() {
    const wins = document.querySelectorAll(".window");

    wins.forEach((win) => {
      const appId = win.dataset.app;
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
      if (
        (e.key === "Enter" || e.key === " ") &&
        !resetBtn.classList.contains("faded")
      ) {
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
      observer.observe(win, { attributes: true, attributeFilter: ["style"] });
    });
  }, 300);

  document.addEventListener("windows:statechange", checkWindowsModified);

  function initMobileMenu() {
    if (window.innerWidth <= 767) {
      bar.addEventListener("click", (e) => {
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
        if (
          leftMenu &&
          leftMenu.classList.contains("menu-open") &&
          !bar.contains(e.target)
        ) {
          leftMenu.classList.remove("menu-open");
        }
      });
    }
  }

  function getWindow(app) {
    return document.querySelector(`.window[data-app="${app}"]`);
  }
  function focusWindow(win) {
    if (!win) return;
    win.dispatchEvent(new Event("click", { bubbles: true }));
  }
  function maximizeWindow(win) {
    if (!win) return;
    const btn = win.querySelector(".window-button.maximize");
    if (btn) btn.click();
  }
  function restoreIfHidden(win) {
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
        restoreIfHidden(win);
        if (delta < 350) {
          maximizeWindow(win);
        } else {
          focusWindow(win);
        }
        if (window.__ensureWindowsRespectMenubar) {
          setTimeout(() => window.__ensureWindowsRespectMenubar(), 0);
        }
      }
    });

    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        item.click();
      }
      if (e.key === "ArrowDown") {
        const win = getWindow(item.dataset.app);
        if (win) {
          const content = win.querySelector(".window-content");
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

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth > 767 && leftMenu) {
        leftMenu.classList.remove("menu-open");
      }
    }, 250);
  });
})();
