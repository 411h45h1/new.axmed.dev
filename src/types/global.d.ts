// Global type declarations for custom window properties and DOM extensions

declare global {
  interface Window {
    __WINDOWS_INITED__?: boolean;
    __SUPPRESS_SAVE__?: boolean;
    __ensureWindowsRespectMenubar?: () => void;
    __toggleMaximize?: (win: HTMLElement) => void;
    saveState?: (wins: Element[]) => void;
  }

  // Type guard helpers
  function isHTMLElement(element: unknown): element is HTMLElement;
  function isHTMLCanvasElement(element: unknown): element is HTMLCanvasElement;
  function isHTMLVideoElement(element: unknown): element is HTMLVideoElement;
}

// Type guard implementations
export function isHTMLElement(element: unknown): element is HTMLElement {
  return element instanceof HTMLElement;
}

export function isHTMLCanvasElement(element: unknown): element is HTMLCanvasElement {
  return element instanceof HTMLCanvasElement;
}

export function isHTMLVideoElement(element: unknown): element is HTMLVideoElement {
  return element instanceof HTMLVideoElement;
}

export {};
