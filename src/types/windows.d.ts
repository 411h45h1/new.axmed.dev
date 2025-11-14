// Type definitions for window management system

export interface WindowData {
  left: number;
  top: number;
  width: number;
  height: number;
  hidden: boolean;
  maximized: boolean;
  zIndex?: string;
}

export interface WindowState {
  windows: Record<string, WindowData>;
  viewport?: {
    width: number;
    height: number;
    timestamp: number;
  };
}

export interface PositionData {
  windowData: Array<{
    w: HTMLElement;
    left: number;
    top: number;
    width: number;
    height: number;
    originalStyle: string;
  }>;
  scale: number;
}

export interface LayoutEntry {
  win: HTMLElement;
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface SmartLayout {
  entries: LayoutEntry[];
  totalWidth: number;
  totalHeight: number;
}
