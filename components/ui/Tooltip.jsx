"use client";

import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

/**
 * A highly accessible, robust Tooltip component powered by Radix UI primitives.
 * Supports hover, keyboard focus, custom placement, and light/dark theme aesthetics.
 * Fully compatible with both `content` and `text` props for seamless integration.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The trigger element.
 * @param {React.ReactNode} [props.content] - The tooltip content.
 * @param {React.ReactNode} [props.text] - @deprecated Use `props.content` instead. Fallback content prop for backward compatibility.
 * @param {'top' | 'bottom' | 'left' | 'right'} [props.position="top"] - Placement of the tooltip content relative to the trigger.
 * @param {string} [props.className] - Additional styling classes for the tooltip content.
 * @param {number} [props.delayDuration=200] - Open delay in milliseconds.
 */
export default function Tooltip({
  children,
  content,
  text,
  position = "top",
  className = "",
  delayDuration = 200,
}) {
  const displayContent = content || text;

  if (!displayContent) return <>{children}</>;

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={position}
            align="center"
            sideOffset={4}
            className={cn(
              "z-50 overflow-hidden rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 shadow-md animate-in fade-in-50 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-50 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:bg-zinc-100 dark:text-zinc-900 border border-zinc-800 dark:border-zinc-200/20 max-w-xs break-words",
              className
            )}
          >
            {displayContent}
            <TooltipPrimitive.Arrow className="fill-zinc-900 dark:fill-zinc-100" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
