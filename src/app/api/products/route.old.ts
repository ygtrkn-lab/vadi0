import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Products data path
const productsPath = path.join(process.cwd(), 'src', 'data', 'products.ts');

// Helper to read products
function getProducts() {
  // Dynamic import won't work for writing, so we'll use a JSON file approach
  const jsonPath = path.join(process.cwd(), 'src', 'data', 'products.json');
  
  // If JSON file exists, use it
  if (fs.existsSync(jsonPath)) {
    const data = fs.readFileSync(jsonPath, 'utf-8');
    return JSON.parse(data);
  }
  
  // Otherwise, read from TS file and create JSON
  const { products } = require('@/data/products');
  fs.writeFileSync(jsonPath, JSON.stringify(products, null, 2), 'utf-8');
  return products;
}

// Helper to save products
function saveProducts(products: any[]) {
  const jsonPath = path.join(process.cwd(), 'src', 'data', 'products.json');
  fs.writeFileSync(jsonPath, JSON.stringify(products, null, 2), 'utf-8');
}

// GET all products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const inStock = searchParams.get('inStock');
    
    let products = getProducts();
    
    // Filter by category
    if (category) {
      products = products.filter((p: any) => p.category === category);
    }
    
    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter((p: any) => 
        p.name?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by stock
    if (inStock === 'true') {
      products = products.filter((p: any) => p.inStock !== false);
    } else if (inStock === 'false') {
      products = products.filter((p: any) => p.inStock === false);
    }
    
    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Ürünler yüklenirken hata oluştu' },
      { status: 500 }
    );
  }
}

// POST new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const products = getProducts();
    
    // Generate new ID
    const maxId = Math.max(...products.map((p: any) => p.id), 0);
    const newId = maxId + 1;
    
    // Generate slug
    const slug = body.name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const newProduct = {
      id: newId,
      slug,
      name: body.name,
      price: parseFloat(body.price) || 0,
      oldPrice: parseFloat(body.oldPrice) || 0,
      discount: parseInt(body.discount) || 0,
      image: body.image || '/products/placeholder.jpg',
      hoverImage: body.hoverImage || '',
      gallery: body.gallery || [],
      category: body.category,
      description: body.description || '',
      rating: parseFloat(body.rating) || 5,
      reviewCount: parseInt(body.reviewCount) || 0,
      inStock: body.inStock !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    products.push(newProduct);
    saveProducts(products);
    
    return NextResponse.json({ 
      success: true, 
      data: newProduct,
      message: 'Ürün başarıyla eklendi' 
    });
  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Ürün eklenirken hata oluştu' },
      { status: 500 }
    );
  }
}
