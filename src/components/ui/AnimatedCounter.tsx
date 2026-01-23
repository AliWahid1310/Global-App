"use client";

import { useEffect, useState } from "react";

interface AnimatedCounterProps {
  target: number;
  duration?: number;
  className?: string;
  suffix?: string;
}

export function AnimatedCounter({
  target,
  duration = 2000,
  className = "",
  suffix = "",
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration]);

  return (
    <span className={className}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}
