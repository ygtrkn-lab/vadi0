import type { MetadataRoute } from 'next';

export function buildSitemapXml(entries: MetadataRoute.Sitemap): string {
  const urlset = entries
    .map((entry) => {
      const loc = escapeXml(entry.url);
      const lastmod = entry.lastModified ? `<lastmod>${escapeXml(toIso(entry.lastModified))}</lastmod>` : '';
      const changefreq = entry.changeFrequency
        ? `\n    <changefreq>${escapeXml(String(entry.changeFrequency))}</changefreq>`
        : '';
      const priority = typeof entry.priority === 'number'
        ? `\n    <priority>${formatPriority(entry.priority)}</priority>`
        : '';
      return `\n  <url>\n    <loc>${loc}</loc>${lastmod}${changefreq}${priority}\n  </url>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlset}\n</urlset>\n`;
}

function toIso(value: string | Date): string {
  if (typeof value === 'string') return value;
  return value.toISOString();
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatPriority(value: number): string {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped.toFixed(1);
}
