"use client";

import React, { useState, useId, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * A reusable, accessible Tooltip component with intelligent positioning.
 * 
 * @param {React.ReactNode} children - The trigger element.
 * @param {React.ReactNode} content - Tooltip text or component.
 * @param {'top' | 'bottom' | 'left' | 'right'} placement - Initial placement.
 * @param {number} delay - Delay in ms before showing.
 */
const Tooltip = ({ 
  children, 
  content, 
  placement = "top", 
  delay = 200 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [adjustedPlacement, setAdjustedPlacement] = useState(placement);
  const tooltipId = useId();
  const timeoutRef = useRef(null);
  const tooltipRef = useRef(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
    setAdjustedPlacement(placement); // Reset to preferred placement
  };

  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      const viewport = { w: window.innerWidth, h: window.innerHeight };
      
      let next = placement;
      if (placement === "top" && rect.top < 0) next = "bottom";
      else if (placement === "bottom" && rect.bottom > viewport.h) next = "top";
      else if (placement === "left" && rect.left < 0) next = "right";
      else if (placement === "right" && rect.right > viewport.w) next = "left";

      if (next !== adjustedPlacement) setAdjustedPlacement(next);
    }
  }, [isVisible, placement, adjustedPlacement]);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "bottom-[-4px] left-1/2 -translate-x-1/2 border-r border-b",
    bottom: "top-[-4px] left-1/2 -translate-x-1/2 border-l border-t",
    left: "right-[-4px] top-1/2 -translate-y-1/2 border-r border-t",
    right: "left-[-4px] top-1/2 -translate-y-1/2 border-l border-b",
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {React.isValidElement(children) ? (
        React.cloneElement(children, { "aria-describedby": isVisible ? tooltipId : undefined })
      ) : children}

      <AnimatePresence>
        {isVisible && content && (
          <motion.div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            initial={{ opacity: 0, scale: 0.96, y: adjustedPlacement === "top" ? 4 : adjustedPlacement === "bottom" ? -4 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className={`absolute z-[100] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-100 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl backdrop-blur-md whitespace-nowrap pointer-events-none ${positionClasses[adjustedPlacement]}`}
          >
            {content}
            <div className={`absolute w-1.5 h-1.5 bg-zinc-900 border-zinc-800 rotate-45 ${arrowClasses[adjustedPlacement]}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;