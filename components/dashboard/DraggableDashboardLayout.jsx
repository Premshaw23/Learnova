"use client";

import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { GripHorizontal } from 'lucide-react';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function DraggableDashboardLayout({ children, defaultLayout, layoutKey }) {
  const [layouts, setLayouts] = useState({ lg: defaultLayout });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(`learnova_layout_${layoutKey}`);
    if (saved) {
      try {
        setLayouts(JSON.parse(saved));
      } catch (e) {}
    } else {
      setLayouts({ lg: defaultLayout });
    }
  }, [layoutKey, defaultLayout]);

  const onLayoutChange = (newLayout, allLayouts) => {
    setLayouts(allLayouts);
    localStorage.setItem(`learnova_layout_${layoutKey}`, JSON.stringify(allLayouts));
  };

  if (!mounted) return <div className="animate-pulse h-96 w-full bg-card/10 rounded-2xl"></div>;

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={50}
      onLayoutChange={onLayoutChange}
      draggableHandle=".drag-handle"
      isDraggable={true}
      isResizable={true}
      margin={[24, 24]}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return (
          <div key={child.key} className="relative group bg-card/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl border border-border dark:border-white/10 flex flex-col overflow-hidden h-full">
            <div className="drag-handle absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-2 bg-white/10 rounded-lg cursor-grab active:cursor-grabbing z-50 transition-opacity">
              <GripHorizontal className="w-5 h-5 text-white/70" />
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar">
              {child}
            </div>
          </div>
        );
      })}
    </ResponsiveGridLayout>
  );
}
