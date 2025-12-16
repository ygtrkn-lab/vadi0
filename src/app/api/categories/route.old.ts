import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const categoriesPath = path.join(process.cwd(), 'src/data/categories.json');
const productsPath = path.join(process.cwd(), 'src/data/products.ts');

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
  order: number;
  isActive: boolean;
}

// GET - Tüm kategorileri getir
export async function GET() {
  try {
    const data = await fs.readFile(categoriesPath, 'utf-8');
    const categories: Category[] = JSON.parse(data);
    
    // Sadece aktif kategorileri sırala ve döndür
    const activeCategories = categories
      .filter(c => c.isActive)
      .sort((a, b) => a.order - b.order);
    
    return NextResponse.json(activeCategories);
  } catch (error) {
    console.error('Error reading categories:', error);
    return NextResponse.json({ error: 'Failed to read categories' }, { status: 500 });
  }
}

// POST - Yeni kategori ekle
export async function POST(request: NextRequest) {
  try {
    const newCategory = await request.json();
    
    const data = await fs.readFile(categoriesPath, 'utf-8');
    const categories: Category[] = JSON.parse(data);
    
    // Slug kontrolü
    const existingCategory = categories.find(c => c.slug === newCategory.slug);
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Bu slug zaten kullanılıyor.' },
        { status: 400 }
      );
    }
    
    // Yeni ID oluştur
    const maxId = Math.max(...categories.map(c => c.id), 0);
    newCategory.id = maxId + 1;
    newCategory.productCount = 0;
    newCategory.isActive = true;
    
    categories.push(newCategory);
    await fs.writeFile(categoriesPath, JSON.stringify(categories, null, 2), 'utf-8');
    
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

// PUT - Kategori güncelle
export async function PUT(request: NextRequest) {
  try {
    const updatedCategory = await request.json();
    
    const data = await fs.readFile(categoriesPath, 'utf-8');
    const categories: Category[] = JSON.parse(data);
    
    const index = categories.findIndex(c => c.id === updatedCategory.id);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Kategori bulunamadı.' }, { status: 404 });
    }
    
    categories[index] = { ...categories[index], ...updatedCategory };
    await fs.writeFile(categoriesPath, JSON.stringify(categories, null, 2), 'utf-8');
    
    return NextResponse.json(categories[index]);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}
