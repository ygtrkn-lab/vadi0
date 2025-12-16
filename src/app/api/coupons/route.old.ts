import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src/data/coupons.json');

// GET - Tüm kuponları getir
export async function GET() {
  try {
    const data = await fs.readFile(dataFilePath, 'utf-8');
    const coupons = JSON.parse(data);
    return NextResponse.json(coupons);
  } catch (error) {
    console.error('Error reading coupons:', error);
    return NextResponse.json({ error: 'Failed to read coupons' }, { status: 500 });
  }
}

// POST - Yeni kupon ekle
export async function POST(request: NextRequest) {
  try {
    const newCoupon = await request.json();
    
    const data = await fs.readFile(dataFilePath, 'utf-8');
    const coupons = JSON.parse(data);
    
    // Kupon kodu kontrolü
    const existingCoupon = coupons.find(
      (c: { code: string }) => c.code.toUpperCase() === newCoupon.code.toUpperCase()
    );
    
    if (existingCoupon) {
      return NextResponse.json(
        { error: 'Bu kupon kodu zaten mevcut.' },
        { status: 400 }
      );
    }
    
    newCoupon.id = 'coup_' + Date.now().toString(36);
    coupons.push(newCoupon);
    await fs.writeFile(dataFilePath, JSON.stringify(coupons, null, 2), 'utf-8');
    
    return NextResponse.json(newCoupon, { status: 201 });
  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}

// PUT - Kupon güncelle
export async function PUT(request: NextRequest) {
  try {
    const updatedCoupon = await request.json();
    
    const data = await fs.readFile(dataFilePath, 'utf-8');
    const coupons = JSON.parse(data);
    
    const index = coupons.findIndex((c: { id: string }) => c.id === updatedCoupon.id);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Kupon bulunamadı.' }, { status: 404 });
    }
    
    coupons[index] = { ...coupons[index], ...updatedCoupon };
    await fs.writeFile(dataFilePath, JSON.stringify(coupons, null, 2), 'utf-8');
    
    return NextResponse.json(coupons[index]);
  } catch (error) {
    console.error('Error updating coupon:', error);
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}
