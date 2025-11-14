export function isMobile() {
  return window.innerWidth <= 767;
}

export function isTablet() {
  return window.innerWidth > 767 && window.innerWidth <= 1024;
}

export function isTouchDevice() {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}
