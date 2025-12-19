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

  if (!showNav) return null;
  return <MobileNavBar />;
}
