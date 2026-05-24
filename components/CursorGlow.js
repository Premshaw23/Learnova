"use client";

import { useEffect } from "react";

export default function CursorGlow() {
  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    if (isTouchDevice) return;
    const glow = document.getElementById("cursor-glow");

    let mouseX = 0;
    let mouseY = 0;
    let glowX = 0;
    let glowY = 0;

    const move = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    document.addEventListener("mousemove", move);

    function animate() {
      glowX += (mouseX - glowX) * 0.15;
      glowY += (mouseY - glowY) * 0.15;
      if (glow) {
        glow.style.left = `${glowX}px`;
        glow.style.top = `${glowY}px`;
      }

      requestAnimationFrame(animate);
    }

    animate();

    return () => {
      document.removeEventListener("mousemove", move);
    };
  }, []);

  return null;
}