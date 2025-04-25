// Tipos personalizados para react-dnd
import { Ref } from "react";
import { ConnectDragSource, ConnectDropTarget } from "react-dnd";

declare module "react-dnd" {
  interface DragSourceOptions {
    dropEffect?: string;
    dragPreview?: unknown;
    canDrag?: boolean;
  }

  export function useDrag<
    DragObject = unknown,
    DropResult = unknown,
    CollectedProps = unknown
  >(spec: any): [CollectedProps, ConnectDragSource, any];

  export function useDrop<
    DragObject = unknown,
    DropResult = unknown,
    CollectedProps = unknown
  >(spec: any): [CollectedProps, ConnectDropTarget, any];
}
