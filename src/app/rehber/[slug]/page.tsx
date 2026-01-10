import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Footer, Header, MobileNavBar } from '@/components';
import { GUIDE_CONTENTS, getGuideBySlug, getRelatedGuides } from '@/data/guide-contents';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vadiler.com';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Statik sayfaları oluştur
export async function generateStaticParams() {
  return GUIDE_CONTENTS.map((guide) => ({
    slug: guide.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  
  if (!guide) {
    return { title: 'Rehber Bulunamadı' };
  }
  
  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    keywords: guide.keywords,
    authors: [{ name: guide.author }],
    alternates: {
      canonical: `${BASE_URL}/rehber/${slug}`,
    },
    openGraph: {
      title: guide.metaTitle,
      description: guide.metaDescription,
      url: `${BASE_URL}/rehber/${slug}`,
      type: 'article',
      publishedTime: guide.publishDate,
      authors: [guide.author],
      images: [guide.image],
      siteName: 'Vadiler Çiçek',
      locale: 'tr_TR',
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.metaTitle,
      description: guide.metaDescription,
      images: [guide.image],
    },
  };
}

export default async function GuideDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  
  if (!guide) {
    notFound();
  }
  
  const relatedGuides = getRelatedGuides(slug);

  // Article Schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.metaDescription,
    image: guide.image,
    author: {
      '@type': 'Organization',
      name: guide.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Vadiler Çiçek',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
      },
    },
    datePublished: guide.publishDate,
    dateModified: guide.publishDate,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/rehber/${slug}`,
    },
  };

  // FAQ Schema (eğer varsa)
  const faqSchema = guide.faqItems
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: guide.faqItems.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }
    : null;

  // Breadcrumb Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Ana Sayfa',
        item: BASE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Rehber',
        item: `${BASE_URL}/rehber`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: guide.title,
        item: `${BASE_URL}/rehber/${slug}`,
      },
    ],
  };

  // HowTo Schema (eğer adımlar varsa)
  const howToSchema = guide.howToSteps
    ? {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: guide.title,
        description: guide.excerpt,
        image: guide.image,
        totalTime: `PT${guide.readTime}M`,
        step: guide.howToSteps.map((step, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: step.name,
          text: step.text,
          ...(step.image && { image: step.image }),
        })),
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      {howToSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Header />
      <main className="container mx-auto px-4 pt-32 lg:pt-52 pb-8">
        <nav className="mb-6 max-w-4xl mx-auto">
          <ol className="flex items-center gap-2 text-xs text-gray-500">
            <li>
              <Link href="/" className="hover:text-primary-600 transition">
                Ana Sayfa
              </Link>
            </li>
            <li className="text-gray-300">/</li>
            <li>
              <Link href="/rehber" className="hover:text-primary-600 transition">
                Rehber
              </Link>
            </li>
            <li className="text-gray-300">/</li>
            <li className="text-gray-900 truncate">{guide.title}</li>
          </ol>
        </nav>

        <article className="max-w-4xl mx-auto">
          <header className="rounded-3xl border border-gray-100 bg-white/70 backdrop-blur-md shadow-soft overflow-hidden mb-8">
            <div className="aspect-[16/9] relative">
              <img
                src={guide.image}
                alt={guide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <div className="inline-flex items-center rounded-full border border-white/25 bg-black/35 backdrop-blur px-3 py-1 text-xs font-semibold text-white mb-3">
                  {guide.categoryName}
                </div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                  {guide.title}
                </h1>
                <p className="mt-3 text-sm md:text-base text-white/85 max-w-3xl">
                  {guide.excerpt}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-white/80">
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-white/10 font-semibold">
                      {guide.author.charAt(0)}
                    </span>
                    <span className="font-medium">{guide.author}</span>
                  </span>
                  <span className="text-white/50">•</span>
                  <span>
                    {new Date(guide.publishDate).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="text-white/50">•</span>
                  <span>{guide.readTime} dk okuma</span>
                </div>
              </div>
            </div>
          </header>

          <div 
            className="rounded-3xl border border-gray-100 bg-white/70 backdrop-blur-md shadow-soft p-6 md:p-8 prose prose-base md:prose-lg dark:prose-invert max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: guide.content.replace(/\n/g, '<br />') }}
          />

          {guide.faqItems && guide.faqItems.length > 0 && (
            <div className="rounded-3xl border border-gray-100 bg-white/70 backdrop-blur-md shadow-soft p-6 md:p-8 mb-8">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">Sıkça Sorulan Sorular</h2>
              <div className="space-y-6">
                {guide.faqItems.map((faq, index) => (
                  <div key={index} className="rounded-2xl border border-gray-100 bg-white/70 backdrop-blur p-5">
                    <h3 className="font-semibold text-base md:text-lg mb-3 flex items-start gap-2 text-gray-900">
                      <span className="text-primary-600">S:</span>
                      {faq.question}
                    </h3>
                    <p className="text-gray-600 flex items-start gap-2 text-sm md:text-base">
                      <span className="text-primary-600 font-bold">C:</span>
                      <span>{faq.answer}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-12">
            <h3 className="font-semibold text-gray-900 mb-3">Etiketler</h3>
            <div className="flex flex-wrap gap-2">
              {guide.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="rounded-full border border-gray-200 bg-white/70 backdrop-blur px-3 py-1.5 text-xs font-medium text-gray-700"
                >
                  #{keyword}
                </span>
              ))}
            </div>
          </div>

          {relatedGuides.length > 0 && (
            <div className="border-t pt-12">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">İlgili Rehberler</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {relatedGuides.map((relatedGuide) => (
                  <Link
                    key={relatedGuide.slug}
                    href={`/rehber/${relatedGuide.slug}`}
                    className="group rounded-3xl border border-gray-100 bg-white/70 backdrop-blur-md shadow-soft hover:shadow-soft transition overflow-hidden"
                  >
                    <img
                      src={relatedGuide.image}
                      alt={relatedGuide.title}
                      className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="p-4">
                      <div className="text-xs text-primary-600 font-semibold mb-2">
                        {relatedGuide.categoryName}
                      </div>
                      <h3 className="font-semibold mb-2 text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                        {relatedGuide.title}
                      </h3>
                      <div className="text-xs text-gray-500">{relatedGuide.readTime} dk</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="rounded-3xl border border-gray-100 bg-white/70 backdrop-blur-md shadow-soft p-6 md:p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Rehberimiz Yardımcı Oldu mu?
            </h2>
            <p className="text-sm md:text-base text-gray-600 mb-6">
              Öğrendiklerinizi uygulayın ve sevdiklerinize en güzel çiçekleri gönderin!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/kategoriler"
                className="inline-flex items-center justify-center rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-glow hover:bg-primary-600 transition"
              >
                Çiçek Sipariş Ver
              </Link>
              <Link
                href="/rehber"
                className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white/70 px-6 py-3 text-sm font-semibold text-gray-900 hover:border-gray-300 hover:shadow-soft transition"
              >
                Diğer Rehberler
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <MobileNavBar />
    </>
  );
}
