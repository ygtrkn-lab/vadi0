import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  image: string;
  rating: number;
  category: string;
  inStock: boolean;
  tags?: string[];
}

interface RelatedProductsProps {
  currentProduct?: Product;
  category?: string;
  tags?: string[];
  city?: string;
  limit?: number;
  title?: string;
}

export default function RelatedProducts({
  currentProduct,
  category,
  tags = [],
  city,
  limit = 4,
  title = 'İlgili Ürünler',
}: RelatedProductsProps) {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchRelatedProducts() {
      try {
        // Query parametrelerini oluştur
        const params = new URLSearchParams();
        
        if (category) params.append('category', category);
        if (tags.length > 0) params.append('tags', tags.join(','));
        params.append('limit', String(limit * 2)); // Daha fazla getir, filtreleyeceğiz
        
        const response = await fetch(`/api/products?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch products');
        
        let fetchedProducts: Product[] = await response.json();
        
        // Mevcut ürünü filtrele
        if (currentProduct) {
          fetchedProducts = fetchedProducts.filter(p => p.id !== currentProduct.id);
        }
        
        // Skorlama sistemi ile sırala (category match + tag match)
        const scoredProducts = fetchedProducts.map(product => {
          let score = 0;
          
          // Kategori eşleşmesi
          if (category && product.category === category) {
            score += 10;
          }
          
          // Tag eşleşmesi
          if (tags.length > 0 && product.tags) {
            const matchingTags = product.tags.filter(tag =>
              tags.some(searchTag => 
                tag.toLowerCase().includes(searchTag.toLowerCase())
              )
            );
            score += matchingTags.length * 5;
          }
          
          // Stokta olma bonusu
          if (product.inStock) {
            score += 2;
          }
          
          // Rating bonusu
          score += product.rating;
          
          return { product, score };
        });
        
        // Skora göre sırala ve limitle
        const sortedProducts = scoredProducts
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map(item => item.product);
        
        setProducts(sortedProducts);
      } catch (error) {
        console.error('Error fetching related products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRelatedProducts();
  }, [currentProduct, category, tags, limit]);

  if (loading) {
    return (
      <div className="my-12">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 aspect-square rounded-lg mb-2"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-4 rounded mb-2"></div>
              <div className="bg-gray-200 dark:bg-gray-700 h-4 w-2/3 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="my-12">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {products.map((product) => {
          const categoryPath = product.category;
          const productLink = `/${categoryPath}/${product.slug}`;
          const anchorText = city 
            ? `${city} ${product.name.toLowerCase()}`
            : product.name;

          return (
            <Link
              key={product.id}
              href={productLink}
              className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden hover:shadow-xl transition-shadow"
              title={anchorText}
            >
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                
                {/* Discount Badge */}
                {product.discount && product.discount > 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    -%{product.discount}
                  </div>
                )}
                
                {/* Stock Status */}
                {!product.inStock && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-white text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
                      Tükendi
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-3">
                <h3 className="font-semibold text-sm md:text-base line-clamp-2 mb-2 group-hover:text-pink-500 transition-colors">
                  {product.name}
                </h3>
                
                {/* Rating */}
                <div className="flex items-center gap-1 mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-sm ${
                          i < Math.floor(product.rating)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">
                    ({product.rating.toFixed(1)})
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-pink-600">
                    {product.price.toFixed(2)} ₺
                  </span>
                  {product.oldPrice && product.oldPrice > product.price && (
                    <span className="text-sm text-gray-400 line-through">
                      {product.oldPrice.toFixed(2)} ₺
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
