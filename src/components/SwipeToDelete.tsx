"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";

const DELETE_WIDTH = 76; // px, must match the button's fixed width below
const DRAG_THRESHOLD = 6; // px of horizontal movement before it counts as a swipe, not a tap

/**
 * A row that reveals a "刪除" button when swiped left, like a native
 * iOS list. Every transaction row uses this — pending (not-yet-synced)
 * rows just aren't given an `href`, so tapping the content does
 * nothing but swipe-to-delete still works.
 */
export function SwipeToDelete({
  href,
  onDelete,
  dimmed,
  children,
}: {
  /** Navigate here on a plain tap. Omit for rows that aren't clickable. */
  href?: string;
  onDelete: () => void;
  dimmed?: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const openRef = useRef(false);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const startXRef = useRef(0);
  const startOffsetRef = useRef(0);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    // Without this, a mouse (or trackpad) drag starts a text
    // selection instead of the swipe gesture.
    e.preventDefault();
    draggingRef.current = true;
    movedRef.current = false;
    startXRef.current = e.clientX;
    startOffsetRef.current = openRef.current ? -DELETE_WIDTH : 0;
    setIsDragging(true);
    // Safari can throw here for some pointer types; capture is just an
    // optimization (keeps tracking the drag if the finger leaves the
    // element), so a failure here shouldn't break the gesture.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > DRAG_THRESHOLD) movedRef.current = true;
    setDragX(Math.min(0, Math.max(-DELETE_WIDTH, startOffsetRef.current + delta)));
  }

  function endDrag() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);
    setDragX((current) => {
      const shouldOpen = current < -DELETE_WIDTH / 2;
      openRef.current = shouldOpen;
      return shouldOpen ? -DELETE_WIDTH : 0;
    });
  }

  function handleClick(e: React.MouseEvent) {
    if (movedRef.current) {
      e.preventDefault();
      return;
    }
    if (openRef.current) {
      // First tap while open just closes it, matching the usual
      // swipe-list convention, instead of also navigating.
      e.preventDefault();
      openRef.current = false;
      setDragX(0);
      return;
    }
    if (href) {
      e.preventDefault();
      router.push(href);
    }
  }

  return (
    <div className="relative overflow-hidden border-b border-gray-100 dark:border-slate-800">
      <button
        type="button"
        onClick={onDelete}
        aria-label="刪除"
        style={{ width: DELETE_WIDTH }}
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-rose-600 text-white text-sm font-medium"
      >
        刪除
      </button>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={handleClick}
        style={{ transform: `translateX(${dragX}px)`, touchAction: "pan-y" }}
        className={`relative select-none px-4 py-2.5 bg-white dark:bg-slate-900 ${
          isDragging ? "" : "transition-transform duration-200"
        } ${dimmed ? "" : "cursor-pointer"}`}
      >
        {/* opacity goes on this inner wrapper, not the row above — that
            row's background needs to stay fully opaque or the delete
            button behind it shows through. */}
        <div className={`flex items-center gap-3 ${dimmed ? "opacity-70" : ""}`}>{children}</div>
      </div>
    </div>
  );
}
