# Phase 1: Video Player Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Standalone Vite + React + TypeScript app with canvas-based video player, frame stepping, keyboard shortcuts, and drag-and-drop file loading.

**Architecture:** Hidden `<video>` element as decode source, visible `<canvas>` for rendering with `requestAnimationFrame` loop during playback. Zustand store manages all playback state. SVG overlay layer (empty in Phase 1) sits atop canvas for future sensor widget.

**Tech Stack:** Vite, React 19, TypeScript, Tailwind CSS v4, Zustand, Lucide React

**Status:** COMPLETED

---

## Delivered Components

1. `src/types/config.ts` — Full config JSON TypeScript types matching plan schema
2. `src/types/video.ts` — Video metadata types, playback speed constants
3. `src/stores/videoStore.ts` — Zustand store: load/unload video, play/pause, frame step, seek, speed
4. `src/components/shared/FileDropzone.tsx` — Drag-and-drop with format detection and error display
5. `src/components/video/VideoPlayer.tsx` — Canvas-based player with frame-accurate seeking
6. `src/components/video/VideoControls.tsx` — Transport controls, seek bar, speed toggle, frame counter
7. `src/components/layout/AppShell.tsx` — Full layout with header, module tabs, sidebar slot
8. `src/hooks/useKeyboardShortcuts.ts` — Space, arrows, comma/period, brackets
9. `src/App.tsx` — Root component wiring everything together

## Key Decisions
- Videos loaded as object URLs, never leave browser
- Frame index is canonical position (not timestamp)
- Default FPS = 30 (browsers don't expose true FPS from metadata)
- Dark theme with CSS custom properties for future light mode toggle
