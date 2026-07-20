"use client";

import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type Position = {
  x: number;
  y: number;
};

type DragState = {
  pointerId: number;
  startPointerX: number;
  startPointerY: number;
  startPosition: Position;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

type DraggableBobProps = {
  children: ReactNode;
};

const INITIAL_POSITION: Position = { x: 0, y: 0 };
const KEYBOARD_STEP = 14;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export default function DraggableBob({ children }: DraggableBobProps) {
  const bobRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<DragState | null>(null);
  const positionRef = useRef<Position>(INITIAL_POSITION);
  const [position, setPositionState] = useState<Position>(INITIAL_POSITION);
  const [isDragging, setIsDragging] = useState(false);

  const setPosition = useCallback((nextPosition: Position) => {
    positionRef.current = nextPosition;
    setPositionState(nextPosition);
  }, []);

  const getBounds = useCallback((currentPosition: Position) => {
    const bob = bobRef.current;
    const viewer = bob?.parentElement;
    if (!bob || !viewer) return null;

    const bobBounds = bob.getBoundingClientRect();
    const viewerBounds = viewer.getBoundingClientRect();

    return {
      minX: currentPosition.x + viewerBounds.left - bobBounds.left,
      maxX: currentPosition.x + viewerBounds.right - bobBounds.right,
      minY: currentPosition.y + viewerBounds.top - bobBounds.top,
      maxY: currentPosition.y + viewerBounds.bottom - bobBounds.bottom,
    };
  }, []);

  const keepInsideViewer = useCallback(() => {
    const currentPosition = positionRef.current;
    const bounds = getBounds(currentPosition);
    if (!bounds) return;

    const nextPosition = {
      x: clamp(currentPosition.x, bounds.minX, bounds.maxX),
      y: clamp(currentPosition.y, bounds.minY, bounds.maxY),
    };

    if (
      nextPosition.x !== currentPosition.x ||
      nextPosition.y !== currentPosition.y
    ) {
      setPosition(nextPosition);
    }
  }, [getBounds, setPosition]);

  useEffect(() => {
    const bob = bobRef.current;
    const viewer = bob?.parentElement;
    if (!viewer || !("ResizeObserver" in window)) return;

    const observer = new ResizeObserver(keepInsideViewer);
    observer.observe(viewer);
    return () => observer.disconnect();
  }, [keepInsideViewer]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    const bounds = getBounds(positionRef.current);
    if (!bounds) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragState.current = {
      pointerId: event.pointerId,
      startPointerX: event.clientX,
      startPointerY: event.clientY,
      startPosition: positionRef.current,
      ...bounds,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    event.preventDefault();
    event.stopPropagation();
    setPosition({
      x: clamp(
        drag.startPosition.x + event.clientX - drag.startPointerX,
        drag.minX,
        drag.maxX,
      ),
      y: clamp(
        drag.startPosition.y + event.clientY - drag.startPointerY,
        drag.minY,
        drag.maxY,
      ),
    });
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragState.current?.pointerId !== event.pointerId) return;

    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragState.current = null;
    setIsDragging(false);
  };

  const moveWithKeyboard = (deltaX: number, deltaY: number) => {
    const currentPosition = positionRef.current;
    const bounds = getBounds(currentPosition);
    if (!bounds) return;

    setPosition({
      x: clamp(currentPosition.x + deltaX, bounds.minX, bounds.maxX),
      y: clamp(currentPosition.y + deltaY, bounds.minY, bounds.maxY),
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let movement: readonly [number, number] | null = null;

    if (event.key === "ArrowDown") movement = [0, KEYBOARD_STEP];
    if (event.key === "ArrowLeft") movement = [-KEYBOARD_STEP, 0];
    if (event.key === "ArrowRight") movement = [KEYBOARD_STEP, 0];
    if (event.key === "ArrowUp") movement = [0, -KEYBOARD_STEP];

    if (movement) {
      event.preventDefault();
      moveWithKeyboard(movement[0], movement[1]);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setPosition(INITIAL_POSITION);
    }
  };

  const resetPosition = () => setPosition(INITIAL_POSITION);

  return (
    <>
      <div
        aria-label="Bob field position. Drag to move, use arrow keys to adjust, or press Home to reset."
        aria-roledescription="movable territory inspector"
        className={`dashboard-bob-overlay dashboard-bob-overlay--draggable${
          isDragging ? " is-dragging" : ""
        }`}
        onKeyDown={handleKeyDown}
        onLostPointerCapture={finishDrag}
        onPointerCancel={finishDrag}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        ref={bobRef}
        role="group"
        style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
        tabIndex={0}
      >
        {children}
        <span>BOB · FIELD POSITION</span>
        <small aria-hidden="true">Drag to move</small>
      </div>
      <button
        className="bob-position-reset"
        onClick={resetPosition}
        onPointerDown={(event) => event.stopPropagation()}
        type="button"
      >
        Reset Bob position
      </button>
    </>
  );
}
