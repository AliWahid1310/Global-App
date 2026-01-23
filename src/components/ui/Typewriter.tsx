"use client";

import { useState, useEffect } from "react";

interface TypewriterProps {
  texts: string[];
  speed?: number;
  deleteSpeed?: number;
  pauseDuration?: number;
  className?: string;
  cursor?: boolean;
}

export function Typewriter({
  texts,
  speed = 80,
  deleteSpeed = 40,
  pauseDuration = 2000,
  className = "",
  cursor = true,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const currentText = texts[currentIndex];

    if (isPaused) {
      const pauseTimeout = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseDuration);
      return () => clearTimeout(pauseTimeout);
    }

    if (isDeleting) {
      if (displayText === "") {
        setIsDeleting(false);
        setCurrentIndex((prev) => (prev + 1) % texts.length);
        return;
      }
      const timeout = setTimeout(() => {
        setDisplayText((prev) => prev.slice(0, -1));
      }, deleteSpeed);
      return () => clearTimeout(timeout);
    }

    if (displayText === currentText) {
      setIsPaused(true);
      return;
    }

    const timeout = setTimeout(() => {
      setDisplayText(currentText.slice(0, displayText.length + 1));
    }, speed);

    return () => clearTimeout(timeout);
  }, [displayText, currentIndex, isDeleting, isPaused, texts, speed, deleteSpeed, pauseDuration]);

  return (
    <span className={className}>
      {displayText}
      {cursor && (
        <span className="inline-block w-[3px] h-[1em] ml-1 bg-accent-500 animate-blink align-middle" />
      )}
    </span>
  );
}
