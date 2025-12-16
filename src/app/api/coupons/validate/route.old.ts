import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src/data/coupons.json');

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount: number;
  maxDiscount: number;
  usageLimit: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  applicableCategories: number[];
  applicableProducts: number[];
}

// POST - Kupon kodu doğrula
export async function POST(request: NextRequest) {
  try {
    const { code, orderAmount, categoryIds = [], productIds = [] } = await request.json();
    
    const data = await fs.readFile(dataFilePath, 'utf-8');
    const coupons: Coupon[] = JSON.parse(data);
    
    const coupon = coupons.find(
      (c) => c.code.toUpperCase() === code.toUpperCase()
    );
    
    if (!coupon) {
      return NextResponse.json(
        { valid: false, error: 'Geçersiz kupon kodu.' },
        { status: 400 }
      );
    }
    
    // Aktiflik kontrolü
    if (!coupon.isActive) {
      return NextResponse.json(
        { valid: false, error: 'Bu kupon artık geçerli değil.' },
        { status: 400 }
      );
    }
    
    // Tarih kontrolü
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);
    
    if (now < validFrom) {
      return NextResponse.json(
        { valid: false, error: 'Bu kupon henüz aktif değil.' },
        { status: 400 }
      );
    }
    
    if (now > validUntil) {
      return NextResponse.json(
        { valid: false, error: 'Bu kuponun süresi dolmuş.' },
        { status: 400 }
      );
    }
    
    // Kullanım limiti kontrolü
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json(
        { valid: false, error: 'Bu kuponun kullanım limiti dolmuş.' },
        { status: 400 }
      );
    }
    
    // Minimum tutar kontrolü
    if (orderAmount < coupon.minOrderAmount) {
      return NextResponse.json(
        { valid: false, error: `Minimum sipariş tutarı ₺${coupon.minOrderAmount} olmalıdır.` },
        { status: 400 }
      );
    }
    
    // Kategori kontrolü
    if (coupon.applicableCategories.length > 0) {
      const hasValidCategory = categoryIds.some((id: number) => 
        coupon.applicableCategories.includes(id)
      );
      if (!hasValidCategory) {
        return NextResponse.json(
          { valid: false, error: 'Bu kupon sepetinizdeki ürünler için geçerli değil.' },
          { status: 400 }
        );
      }
    }
    
    // Ürün kontrolü
    if (coupon.applicableProducts.length > 0) {
      const hasValidProduct = productIds.some((id: number) => 
        coupon.applicableProducts.includes(id)
      );
      if (!hasValidProduct) {
        return NextResponse.json(
          { valid: false, error: 'Bu kupon sepetinizdeki ürünler için geçerli değil.' },
          { status: 400 }
        );
      }
    }
    
    // İndirim hesapla
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (orderAmount * coupon.value) / 100;
      if (discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.value;
    }
    
    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount: Math.round(discount * 100) / 100,
        description: `%${coupon.value} indirim (maks. ₺${coupon.maxDiscount})`
      }
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 });
  }
}
