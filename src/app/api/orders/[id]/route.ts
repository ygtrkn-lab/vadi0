import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase/server-client';
import { toCamelCase } from '@/lib/supabase/transformer';
import { EmailService } from '@/lib/email/emailService';

// Helper to check if status warrants an email notification
const EMAIL_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'failed', 'payment_failed', 'pending_payment', 'refunded'];

function shouldSendStatusEmail(status: string): boolean {
  return EMAIL_STATUSES.includes(status);
}

// GET - Tek sipariş getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: order, error } = await supabase.from('orders').select('*').eq('id', id).single();

    if (error) {
      if ((error as any)?.code === 'PGRST116') {
        return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 });
      }
      console.error('Error reading order:', error);
      return NextResponse.json({ error: 'Failed to read order' }, { status: 500 });
    }
    
    if (!order) {
      return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 });
    }
    
    return NextResponse.json(toCamelCase(order));
  } catch (error) {
    console.error('Error reading order:', error);
    return NextResponse.json({ error: 'Failed to read order' }, { status: 500 });
  }
}

// DELETE - Sipariş sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase.from('orders').delete().eq('id', id);

    if (error) {
      console.error('Error deleting order:', error);
      return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}

// PATCH - Sipariş durumunu güncelle
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const status = (body?.status || '').toString();

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const nowIso = new Date().toISOString();

    // Read existing timeline (best-effort)
    const { data: existing, error: existingErr } = await supabase
      .from('orders')
      .select('timeline')
      .eq('id', id)
      .single();

    if (existingErr && (existingErr as any)?.code === 'PGRST116') {
      return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 });
    }

    const timelineArr = Array.isArray((existing as any)?.timeline) ? [...((existing as any).timeline as any[])] : [];
    timelineArr.push({ status, timestamp: nowIso, note: 'Durum güncellendi', automated: false });

    const updateData: Record<string, unknown> = {
      status,
      updated_at: nowIso,
      timeline: timelineArr,
    };

    if (status === 'delivered') {
      updateData.delivered_at = nowIso;
    }

    const { data: updated, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating order status:', error);
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
    }

    // Send status email notification for supported statuses
    if (updated && shouldSendStatusEmail(status)) {
      try {
        const delivery = (updated as any).delivery || {};
        const refund = (updated as any).refund || {};
        await EmailService.sendOrderStatusUpdate({
          customerEmail: (updated as any).customer_email || '',
          customerName: (updated as any).customer_name || 'Değerli Müşterimiz',
          orderNumber: String((updated as any).order_number || ''),
          status: status as any,
          deliveryDate: delivery.deliveryDate || delivery.delivery_date || '',
          deliveryTime: delivery.deliveryTimeSlot || delivery.delivery_time_slot || '',
          deliveryAddress: delivery.fullAddress || delivery.full_address || '',
          district: delivery.district || '',
          recipientName: delivery.recipientName || delivery.recipient_name || '',
          recipientPhone: delivery.recipientPhone || delivery.recipient_phone || '',
          refundAmount: refund.amount || undefined,
          refundReason: refund.reason || undefined,
          refundDate: refund.date || undefined,
        });
        console.log(`📧 Status email sent for order ${(updated as any).order_number}: ${status}`);
      } catch (emailError) {
        console.error('Failed to send status email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(toCamelCase(updated));
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
