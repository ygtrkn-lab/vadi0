import { NextRequest, NextResponse } from 'next/server';
import { SettingsManager } from '@/lib/settings/settingsManager';

const CATEGORY_KEY = 'campaigns';
const SETTING_KEY = 'weekly_campaign_product_order';

// GET - Kampanya ürün sıralamasını getir
export async function GET() {
  try {
    const order = await SettingsManager.get(CATEGORY_KEY, SETTING_KEY, []);
    return NextResponse.json({ 
      success: true, 
      order: Array.isArray(order) ? order : [] 
    });
  } catch (error) {
    console.error('Error fetching campaign order:', error);
    return NextResponse.json(
      { success: false, error: 'Kampanya sıralaması alınamadı' },
      { status: 500 }
    );
  }
}

// POST - Kampanya ürün sıralamasını kaydet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order } = body;

    if (!Array.isArray(order)) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz sıralama verisi' },
        { status: 400 }
      );
    }

    // order: Array of product IDs in the desired order
    // e.g., [123, 456, 789, ...]
    const productIds = order.map((id: unknown) => {
      if (typeof id === 'number') return id;
      if (typeof id === 'string') return parseInt(id, 10);
      return null;
    }).filter((id: number | null): id is number => id !== null && !isNaN(id));

    await SettingsManager.set(CATEGORY_KEY, SETTING_KEY, productIds);

    return NextResponse.json({ 
      success: true, 
      message: 'Kampanya sıralaması kaydedildi',
      order: productIds
    });
  } catch (error) {
    console.error('Error saving campaign order:', error);
    return NextResponse.json(
      { success: false, error: 'Kampanya sıralaması kaydedilemedi' },
      { status: 500 }
    );
  }
}

// DELETE - Kampanya sıralamasını sıfırla (varsayılana dön)
export async function DELETE() {
  try {
    await SettingsManager.set(CATEGORY_KEY, SETTING_KEY, []);
    return NextResponse.json({ 
      success: true, 
      message: 'Kampanya sıralaması sıfırlandı' 
    });
  } catch (error) {
    console.error('Error resetting campaign order:', error);
    return NextResponse.json(
      { success: false, error: 'Kampanya sıralaması sıfırlanamadı' },
      { status: 500 }
    );
  }
}
