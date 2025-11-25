// Video Player functionality
export function initVideoPlayer() {
  // Handle demo video links
  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement | null;
    if (!target || !target.classList?.contains("demo-video-link")) return;

    // Only handle left-click (button 0). Allow middle-click and right-click to pass through
    const mouseEvent = e as MouseEvent;
    if (mouseEvent.button !== 0) return;

    // Only prevent default for regular left-clicks
    if (!mouseEvent.ctrlKey && !mouseEvent.metaKey && !mouseEvent.shiftKey) {
      e.preventDefault();
    } else {
      // For modifier key combinations (open in new tab/window), let browser handle it
      return;
    }

    const videoPath = (target as HTMLElement & { dataset: DOMStringMap }).dataset.video;
    if (!videoPath) return;

    // Open video player window
    const videoWindow = document.querySelector(
      '.window[data-app="video-player"]'
    ) as HTMLElement | null;
    if (!videoWindow) return;

    // Update video source
    const video = videoWindow.querySelector("#demo-video") as HTMLVideoElement | null;
    if (video) {
      video.src = videoPath;
      video.load(); // Reload the video element

      // Trigger resize when metadata loads
      video.addEventListener(
        "loadedmetadata",
        () => {
          // Small delay to ensure window is visible before resizing
          setTimeout(() => {
            resizeVideoWindowToContent(video, videoWindow);
          }, 100);
        },
        { once: true }
      );
    }

    // Show and focus the video player window
    videoWindow.classList.remove("hidden", "minimized");

    // Focus the window (trigger click event to use existing focus logic)
    if (videoWindow.dispatchEvent) {
      videoWindow.dispatchEvent(new Event("click", { bubbles: true }));
    }

    // Update dock indicators - show and activate the video player icon
    const dockItem = document.querySelector(
      '.dock-item[data-app="video-player"]'
    ) as HTMLElement | null;
    if (dockItem) {
      dockItem.style.display = "flex";
      dockItem.classList.add("active");
    }

    // Trigger state change event
    document.dispatchEvent(new CustomEvent("windows:statechange"));
  });
}

function resizeVideoWindowToContent(video: HTMLVideoElement, videoWindow: HTMLElement) {
  if (!video || !videoWindow) return;

  // Skip auto-resize on mobile - let responsive CSS handle it
  if (window.innerWidth <= 767) {
    return;
  }

  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  if (videoWidth === 0 || videoHeight === 0) return;

  // Calculate optimal window size
  const maxWidth = Math.min(window.innerWidth * 0.85, 900);
  const maxHeight = Math.min(window.innerHeight * 0.75, 650);

  // Calculate aspect ratio
  const aspectRatio = videoWidth / videoHeight;

  // Calculate scaled video dimensions maintaining aspect ratio
  let scaledWidth = videoWidth;
  let scaledHeight = videoHeight;

  // Scale to fit within max constraints
  if (scaledWidth > maxWidth || scaledHeight > maxHeight) {
    if (scaledWidth / maxWidth > scaledHeight / maxHeight) {
      // Width is the limiting factor
      scaledWidth = maxWidth;
      scaledHeight = scaledWidth / aspectRatio;
    } else {
      // Height is the limiting factor
      scaledHeight = maxHeight;
      scaledWidth = scaledHeight * aspectRatio;
    }
  }

  // Account for window chrome (titlebar ~28px, video-info ~60px)
  const chromeHeight = 88;
  const windowWidth = Math.round(Math.max(scaledWidth, 450));
  const windowHeight = Math.round(Math.max(scaledHeight + chromeHeight, 300));

  // Update window size
  videoWindow.style.width = `${windowWidth}px`;
  videoWindow.style.height = `${windowHeight}px`;

  // Center window
  const centerX = (window.innerWidth - windowWidth) / 2;
  const centerY = (window.innerHeight - windowHeight) / 2;

  videoWindow.style.left = `${Math.max(centerX, 20)}px`;
  videoWindow.style.top = `${Math.max(centerY, 50)}px`;

  // Trigger window system update
  if (window.saveState) {
    const allWindows = Array.from(document.querySelectorAll(".window"));
    window.saveState(allWindows);
  }
}
