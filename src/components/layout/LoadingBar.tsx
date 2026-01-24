"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function LoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Route change completed - finish the bar
    if (loading) {
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          setLoading(false);
          setProgress(0);
        }, 200);
      }, 200);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;

    const handleStart = () => {
      setLoading(true);
      setVisible(true);
      setProgress(0);
      
      // Quick initial jump
      setTimeout(() => setProgress(30), 50);
      
      // Gradually increase progress, slowing down as it gets higher
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          // Slow down as we progress
          const increment = prev < 50 ? 10 : prev < 70 ? 5 : 2;
          return Math.min(prev + increment, 90);
        });
      }, 300);
    };

    // Listen for link clicks to show loading
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && !link.href.startsWith('javascript:') && !link.href.startsWith('#') && !link.target && !link.download) {
        try {
          const url = new URL(link.href);
          if (url.origin === window.location.origin && url.pathname !== pathname) {
            handleStart();
          }
        } catch {
          // Invalid URL, ignore
        }
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-dark-800/50">
      <div
        className="h-full bg-gradient-to-r from-accent-500 via-accent-400 to-accent-500 shadow-[0_0_10px_rgba(139,92,246,0.7)] transition-all ease-out"
        style={{ 
          width: `${progress}%`,
          transitionDuration: progress === 100 ? '200ms' : '400ms'
        }}
      />
    </div>
  );
}
