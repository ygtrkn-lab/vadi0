import { NextResponse } from 'next/server';
import { processAutomatedUpdates } from '@/lib/orderAutomation';

/**
 * Sipariş Otomasyonu API Endpoint
 * 
 * Bu endpoint her dakika çağrılarak otomatik durum güncellemelerini gerçekleştirir.
 * Vercel Cron Jobs veya harici bir scheduler ile kullanılabilir.
 * 
 * GET /api/orders/automation
 */
export async function GET(request: Request) {
  try {
    // Authorization kontrolü (opsiyonel - güvenlik için eklenebilir)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Vercel Cron Jobs requests include this header.
    // Note: This header can be spoofed on public endpoints; keep CRON_SECRET for stronger protection
    // when you trigger the endpoint from outside Vercel.
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';
    
    // Eğer CRON_SECRET tanımlıysa kontrol et.
    // Vercel Cron'un Authorization header set edememesi durumunda x-vercel-cron'u da kabul ediyoruz.
    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && !isVercelCron) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Otomatik güncellemeleri işle
    const result = await processAutomatedUpdates();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result
    });
  } catch (error) {
    console.error('Automation API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Manuel tetikleme için POST endpoint
 * (Test ve admin panel için kullanılabilir)
 */
export async function POST(request: Request) {
  try {
    const result = await processAutomatedUpdates();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Automation manually triggered',
      ...result
    });
  } catch (error) {
    console.error('Automation API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
