"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function LoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Route change completed - hide the bar
    if (loading) {
      // Small delay to let animation complete
      setTimeout(() => {
        setVisible(false);
        setLoading(false);
      }, 300);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleStart = () => {
      setLoading(true);
      setVisible(true);
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
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-dark-800/50 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-accent-500 to-accent-400 shadow-[0_0_10px_rgba(139,92,246,0.7)] animate-loading-bar"
      />
    </div>
  );
}
