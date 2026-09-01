'use client';

import { useSyncExternalStore } from 'react';

const OVERLAY_CHANGE_EVENT = 'extratime_overlay_change';
let activeOverlayCount = 0;

function subscribeOverlay(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(OVERLAY_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener(OVERLAY_CHANGE_EVENT, callback);
  };
}

function getOverlaySnapshot(): boolean {
  return activeOverlayCount > 0;
}

function getServerOverlaySnapshot(): boolean {
  return false;
}

export function setOverlayActive(active: boolean): void {
  if (typeof window === 'undefined') return;
  if (active) {
    activeOverlayCount = Math.max(1, activeOverlayCount + 1);
  } else {
    activeOverlayCount = Math.max(0, activeOverlayCount - 1);
  }
  window.dispatchEvent(new Event(OVERLAY_CHANGE_EVENT));
}

export function useOverlayActive(): boolean {
  return useSyncExternalStore(
    subscribeOverlay,
    getOverlaySnapshot,
    getServerOverlaySnapshot,
  );
}
