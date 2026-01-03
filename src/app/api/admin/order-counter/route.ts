import { NextRequest, NextResponse } from 'next/server';
import { getCounterInfo, resetCounter, isValidOrderNumber } from '@/lib/orderNumberGenerator';

// GET - Counter bilgisini getir (yönetim için)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const counterInfo = await getCounterInfo();
    
    return NextResponse.json({
      success: true,
      counter: counterInfo,
      nextOrderNumber: counterInfo.nextOrderNumber,
      totalOrders: counterInfo.totalOrders,
    });
  } catch (error) {
    console.error('Error getting counter info:', error);
    return NextResponse.json(
      { error: 'Counter bilgisi alınamadı.' },
      { status: 500 }
    );
  }
}

// POST - Counter'ı sıfırla (admin işlemi)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { startNumber } = body;

    // Güvenlik: başlangıç numarasını doğrula (6 haneli olmalı)
    if (startNumber && !isValidOrderNumber(startNumber)) {
      return NextResponse.json(
        { error: 'Başlangıç numarası 100000 ile 999999 arasında olmalıdır.' },
        { status: 400 }
      );
    }

    const newCounter = await resetCounter(startNumber || 100001);

    return NextResponse.json({
      success: true,
      message: 'Counter sıfırlandı.',
      counter: newCounter,
    });
  } catch (error) {
    console.error('Error resetting counter:', error);
    return NextResponse.json(
      { error: 'Counter sıfırlanırken hata oluştu.' },
      { status: 500 }
    );
  }
}
