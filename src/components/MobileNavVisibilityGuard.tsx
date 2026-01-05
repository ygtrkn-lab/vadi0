"use client";

import { useEffect, useState } from 'react';
import MobileNavBar from './MobileNavBar';

/**
 * Shows MobileNavBar only after the hero section is out of view.
 */
export default function MobileNavVisibilityGuard() {
  const [showNav, setShowNav] = useState(false);

  useEffect(() => {
    const target = document.getElementById('hero-section');
    if (!target) {
      setShowNav(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setShowNav(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // Keep MobileNavBar mounted so it can listen for Header events (openMobileSidebar)
  // even while the hero section is visible. Only the bottom bar is toggled.
  return <MobileNavBar showBottomBar={showNav} />;
}
