// Tipos personalizados para react-dnd
import { ConnectDragSource, ConnectDropTarget } from "react-dnd";

declare module "react-dnd" {
  interface DragSourceOptions {
    dropEffect?: string;
    dragPreview?: unknown;
    canDrag?: boolean;
  }

  interface DragSourceMonitor {
    isDragging(): boolean;
    getItemType(): string;
    getItem(): unknown;
    getDropResult(): unknown;
    didDrop(): boolean;
  }

  interface DropTargetMonitor {
    isOver(): boolean;
    isOver(options: { shallow: boolean }): boolean;
    canDrop(): boolean;
    getItemType(): string;
    getItem(): unknown;
  }

  export function useDrag<TItem = unknown, TCollect = unknown>(spec: {
    type: string;
    item: TItem | (() => TItem);
    collect?: (monitor: DragSourceMonitor) => TCollect;
    canDrag?: boolean | ((monitor: DragSourceMonitor) => boolean);
    end?: (item: TItem, monitor: DragSourceMonitor) => void;
    options?: Record<string, unknown>;
  }): [TCollect, ConnectDragSource];

  export function useDrop<
    TItem = unknown,
    TResult = unknown,
    TCollect = unknown
  >(spec: {
    accept: string | string[];
    drop?: (item: TItem, monitor: DropTargetMonitor) => TResult | void;
    canDrop?: (item: TItem, monitor: DropTargetMonitor) => boolean;
    collect?: (monitor: DropTargetMonitor) => TCollect;
    options?: Record<string, unknown>;
  }): [TCollect, ConnectDropTarget];
}
