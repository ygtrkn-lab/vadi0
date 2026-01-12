import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { toCamelCase } from '@/lib/supabase/transformer';

function parseDate(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start = parseDate(searchParams.get('start'));
    const end = parseDate(searchParams.get('end'));

    // Positive statuses that should appear in sales report
    // Excludes: refunded, cancelled, failed, payment_failed
    const positiveStatuses = ['pending', 'pending_payment', 'confirmed', 'processing', 'preparing', 'shipped', 'on_the_way', 'delivered'];

    let query = supabaseAdmin
      .from('orders')
      .select('id, order_number, customer_name, customer_phone, total, delivery, products, payment, status, created_at')
      .eq('payment->>status', 'paid')
      .in('status', positiveStatuses)
      .order('created_at', { ascending: false });

    if (start) query = query.gte('created_at', start);
    if (end) query = query.lte('created_at', end);

    const { data, error } = await query;
    if (error) {
      console.error('Sales report query error:', error);
      return NextResponse.json({ error: 'Veri alınamadı' }, { status: 500 });
    }

    const orders = toCamelCase<any[]>(data || []);

    // Aggregate stats on server for accuracy
    const productSalesMap = new Map<string, {
      productId: string;
      productName: string;
      productImage: string;
      productSlug: string;
      productCategory: string;
      productPrice: number;
      totalQuantity: number;
      totalRevenue: number;
      orderCount: number;
    }>();

    const districtSalesMap = new Map<string, {
      district: string;
      province: string;
      orderCount: number;
      revenue: number;
      productCount: number;
    }>();

    for (const o of orders) {
      const items = Array.isArray(o.products) ? o.products : [];
      for (const item of items) {
        const productId = String(item.productId || item.id || '');
        if (!productId) continue;
        const quantity = Number(item.quantity || 1);
        const price = Number(item.price || 0);
        const existing = productSalesMap.get(productId);
        if (existing) {
          existing.totalQuantity += quantity;
          existing.totalRevenue += price * quantity;
          existing.orderCount += 1;
        } else {
          productSalesMap.set(productId, {
            productId,
            productName: item.name || `Ürün #${productId}`,
            productImage: item.image || '',
            productSlug: item.slug || '',
            productCategory: item.category || '',
            productPrice: price,
            totalQuantity: quantity,
            totalRevenue: price * quantity,
            orderCount: 1,
          });
        }
      }

      const delivery = o.delivery || {};
      const district = String(delivery.district || 'Bilinmiyor');
      const province = String(delivery.province || 'İstanbul');
      const orderTotal = Number(o.total || 0);
      const productCount = items.reduce((sum: number, p: any) => sum + Number(p.quantity || 1), 0);
      const dExisting = districtSalesMap.get(district);
      if (dExisting) {
        dExisting.orderCount += 1;
        dExisting.revenue += orderTotal;
        dExisting.productCount += productCount;
      } else {
        districtSalesMap.set(district, {
          district,
          province,
          orderCount: 1,
          revenue: orderTotal,
          productCount,
        });
      }
    }

    const sales = Array.from(productSalesMap.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity);

    const districtSales = Array.from(districtSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue);

    const stats = {
      totalProducts: sales.length,
      totalQuantity: sales.reduce((sum, p) => sum + p.totalQuantity, 0),
      totalRevenue: orders.reduce((sum, o) => sum + Number(o.total || 0), 0),
      totalOrders: orders.length,
    };

    return NextResponse.json({
      paidOrders: orders,
      sales,
      districtSales,
      stats,
    });
  } catch (error) {
    console.error('GET /api/admin/sales-report error:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
