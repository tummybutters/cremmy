"use client";

import { useCallback, useSyncExternalStore } from "react";

type Listener = () => void;

let sidebarOpen = false;
const listeners = new Set<Listener>();

function setSidebarState(next: boolean | ((prev: boolean) => boolean)) {
  const value = typeof next === "function" ? (next as (prev: boolean) => boolean)(sidebarOpen) : next;
  if (value === sidebarOpen) return;
  sidebarOpen = value;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return sidebarOpen;
}

export function useSidebarToggle() {
  const isOpen = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const toggle = useCallback(() => {
    setSidebarState((prev) => !prev);
  }, []);

  const close = useCallback(() => {
    setSidebarState(false);
  }, []);

  const open = useCallback(() => {
    setSidebarState(true);
  }, []);

  return { isOpen, toggle, close, open };
}

