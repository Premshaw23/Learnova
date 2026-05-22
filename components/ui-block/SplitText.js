"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const SplitText = ({
  text,
  className,
  delay = 0.05, // delay per letter
  duration = 0.6,
  splitType = "chars", // could extend to "words"
  from = { opacity: 0, y: 30 },
  to = { opacity: 1, y: 0 },
  textAlign = "left",
  onLetterAnimationComplete,
  waitForFonts = true,
}) => {
  const [fontsReady, setFontsReady] = useState(!waitForFonts);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    if (waitForFonts && document.fonts) {
      document.fonts.ready
        .then(() => {
          setFontsReady(true);
        })
        .catch(() => {
          console.warn("Font loading check failed, fallback");
          setFontsReady(true);
        });
    }
  }, [waitForFonts]);

  useEffect(() => {
    if (fontsReady && onLetterAnimationComplete) {
      const totalTime = delay * text.length + duration * 1000;
      const timer = setTimeout(() => onLetterAnimationComplete(), totalTime);
      return () => clearTimeout(timer);
    }
  }, [fontsReady, delay, duration, text, onLetterAnimationComplete]);

  if (!mounted) return null;

  // Split into chars or words
  const parts = splitType === "words" ? text.split(" ") : text.split("");

  return (
    <div className={className} style={{ display: "inline-block", textAlign }}>
      {fontsReady
        ? parts.map((char, i) => (
            <motion.span
              key={i}
              initial={from}
              animate={to}
              transition={{
                delay: i * delay,
                duration,
                ease: "easeOut",
              }}
              style={{ display: "inline-block", whiteSpace: "pre" }}
            >
              {char}
              {splitType === "words" ? " " : ""}
            </motion.span>
          ))
        : text}
    </div>
  );
};

export default SplitText;
