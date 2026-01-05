import { useState, useEffect, useCallback } from 'react';

// Module-level cache to avoid repeated fetches across components
let cachedMap: Record<string, string> | null = null;
let inFlight: Promise<Record<string, string>> | null = null;

function buildMap(categories: Array<{ slug?: string; name?: string }>): Record<string, string> {
  return categories.reduce<Record<string, string>>((acc, category) => {
    if (category.slug && category.name) {
      acc[category.slug] = category.name;
    }
    return acc;
  }, {});
}

export function useCategoryNames() {
  const [map, setMap] = useState<Record<string, string>>(cachedMap || {});

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (cachedMap) return;
      if (!inFlight) {
        inFlight = fetch('/api/categories', { cache: 'no-store' })
          .then(async (res) => {
            if (!res.ok) return {} as Record<string, string>;
            const data = await res.json();
            const categories = data.categories || data.data || [];
            return buildMap(categories);
          })
          .catch(() => ({}));
      }

      const result = await inFlight;
      if (isMounted) {
        cachedMap = result;
        setMap(result);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const getName = useCallback(
    (slug?: string, fallback?: string) => {
      if (!slug) return fallback || '';
      return map[slug] || fallback || slug.replace(/-/g, ' ');
    },
    [map]
  );

  return { map, getName };
}
