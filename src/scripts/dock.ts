import { isMobile } from "./windows/responsive.js";

export function initDock() {
  const dock = document.getElementById("dock");
  if (!dock) return;
  const items = Array.from(dock.querySelectorAll<HTMLElement>(".dock-item"));
  const maxScale = 1.85;
  const influence = 140;

  function initMagnification() {
    if (isMobile()) {
      if (dock) {
        dock.removeEventListener("mousemove", handleMouseMove);
        dock.removeEventListener("mouseleave", handleMouseLeave);
      }
      items.forEach((i) => (i.style.transform = ""));
      return;
    }

    if (dock) {
      dock.addEventListener("mousemove", handleMouseMove);
      dock.addEventListener("mouseleave", handleMouseLeave);
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (isMobile() || !dock) return;
    const rect = dock.getBoundingClientRect();
    const x = e.clientX - rect.left;
    items.forEach((item) => {
      const r = item.getBoundingClientRect();
      const ix = r.left + r.width / 2 - rect.left;
      const dist = Math.abs(x - ix);
      const scale = Math.max(1, maxScale - (dist / influence) * (maxScale - 1));
      const lift = (scale - 1) * 16;
      item.style.transform = `translateY(${-lift}px) scale(${scale.toFixed(3)})`;
    });
  }

  function handleMouseLeave() {
    items.forEach((i) => (i.style.transform = ""));
  }

  initMagnification();

  items.forEach((di) => {
    di.addEventListener("click", () => {
      const app = di.dataset.app;
      const w = document.querySelector<HTMLElement>(`.window[data-app="${app}"]`);
      if (!w) return;

      if (isMobile()) {
        const allWindows = document.querySelectorAll<HTMLElement>(".window");
        allWindows.forEach((win) => {
          if (win !== w) {
            win.classList.add("hidden");
          }
        });
        w.classList.remove("hidden", "minimized");
        focus(w);

        const menubar = document.getElementById("menubar");
        if (menubar) {
          const title = w.querySelector(".title")?.textContent || "";
          menubar.setAttribute("data-screen-title", title);
        }

        const wins = Array.from(document.querySelectorAll<HTMLElement>(".window"));
        if (window.saveState) {
          setTimeout(() => window.saveState?.(wins), 100);
        }
      } else {
        const isHidden = w.classList.contains("hidden");
        const isMinimized = w.classList.contains("minimized");
        const isFocused = w.classList.contains("focused");
        const isMaximized = w.classList.contains("maximized");

        if (isHidden) {
          w.classList.remove("hidden", "minimized");
          focus(w);
          if (window.__ensureWindowsRespectMenubar) {
            setTimeout(() => window.__ensureWindowsRespectMenubar?.(), 0);
          }
        } else if (isMinimized) {
          w.classList.remove("minimized");
          w.style.removeProperty("transform");
          focus(w);
        } else if (isFocused && !isMaximized) {
          if (window.__toggleMaximize) {
            window.__toggleMaximize?.(w);
          }
        } else if (isFocused && isMaximized) {
          if (window.__toggleMaximize) {
            window.__toggleMaximize?.(w);
          }
        } else {
          focus(w);
        }
      }
      syncIndicators();
    });
  });
  function focus(win: HTMLElement) {
    win.dispatchEvent(new Event("click", { bubbles: true }));
  }
  function syncIndicators() {
    items.forEach((di) => {
      const app = di.dataset.app;
      const w = document.querySelector(`.window[data-app="${app}"]`);
      const isOpen = !!w && !w.classList.contains("hidden");
      di.classList.toggle("active", isOpen);

      // Hide video player dock icon when window is closed
      if (app === "video-player") {
        di.style.display = isOpen ? "flex" : "none";
      }
    });
  }
  document.addEventListener("windows:statechange", syncIndicators);
  syncIndicators();

  items.forEach((item) => {
    item.addEventListener("keydown", (e) => {
      const keyEvent = e as KeyboardEvent;
      if (keyEvent.key === "Enter" || keyEvent.key === " ") {
        e.preventDefault();
        item.click();
      }
    });
  });

  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      initMagnification();
    }, 250);
  });

  return { syncIndicators };
}
