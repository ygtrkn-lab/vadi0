import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase/server-client';
import { toCamelCase } from '@/lib/supabase/transformer';
import { EmailService } from '@/lib/email/emailService';

// POST - Process refund for an order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, reason, amount, notes } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Sipariş ID gerekli.' }, { status: 400 });
    }

    // Fetch the existing order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      console.error('Order not found:', fetchError);
      return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 });
    }

    const nowIso = new Date().toISOString();
    const refundAmount = typeof amount === 'number' ? amount : (order as any).total || 0;

    // Build refund data
    const refundData = {
      status: 'completed',
      amount: refundAmount,
      reason: reason || 'Müşteri talebi',
      notes: notes || '',
      processedAt: nowIso,
      processedBy: 'admin',
    };

    // Update timeline
    const timelineArr = Array.isArray((order as any).timeline) ? [...((order as any).timeline as any[])] : [];
    timelineArr.push({
      status: 'refunded',
      timestamp: nowIso,
      note: `İade işlemi tamamlandı. Tutar: ₺${refundAmount.toLocaleString('tr-TR')}. Sebep: ${refundData.reason}`,
      automated: false,
    });

    // Update the order
    const { data: updated, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'refunded',
        refund: refundData,
        timeline: timelineArr,
        updated_at: nowIso,
      })
      .eq('id', orderId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating order for refund:', updateError);
      return NextResponse.json({ error: 'İade işlemi başarısız.' }, { status: 500 });
    }

    // Send refund notification email
    try {
      const delivery = (updated as any).delivery || {};
      await EmailService.sendOrderStatusUpdate({
        customerEmail: (updated as any).customer_email || '',
        customerName: (updated as any).customer_name || 'Değerli Müşterimiz',
        orderNumber: String((updated as any).order_number || ''),
        status: 'refunded',
        deliveryDate: delivery.deliveryDate || delivery.delivery_date || '',
        deliveryTime: delivery.deliveryTimeSlot || delivery.delivery_time_slot || '',
        deliveryAddress: delivery.fullAddress || delivery.full_address || '',
        district: delivery.district || '',
        recipientName: delivery.recipientName || delivery.recipient_name || '',
        recipientPhone: delivery.recipientPhone || delivery.recipient_phone || '',
        refundAmount,
        refundReason: refundData.reason,
        refundDate: nowIso,
      });
      console.log(`📧 Refund email sent for order ${(updated as any).order_number}`);
    } catch (emailError) {
      console.error('Failed to send refund email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'İade işlemi başarıyla tamamlandı.',
      order: toCamelCase(updated),
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json({ error: 'İade işlemi başarısız.' }, { status: 500 });
  }
}
