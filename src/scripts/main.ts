import { initWallpaper } from "./wallpaper.js";
import { initClock } from "./clock.js";
import { initDock } from "./dock.js";
import { initWindows } from "./windows/index.js";
import { initVideoPlayer } from "./video-player.js";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initWallpaper();
    initClock();
    initWindows();
    initDock();
    initVideoPlayer();
  });
} else {
  initWallpaper();
  initClock();
  initWindows();
  initDock();
  initVideoPlayer();
}
