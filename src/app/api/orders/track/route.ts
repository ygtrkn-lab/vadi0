import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase/server-client';
import type { Database, Json } from '@/lib/supabase/types';

type VerificationType = 'email' | 'phone';

type OrderRow = Database['public']['Tables']['orders']['Row'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function getString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function getJsonRecord(value: Json | null | undefined): Record<string, unknown> {
  return isRecord(value) ? (value as Record<string, unknown>) : {};
}

function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('90') && digits.length > 10) {
    return digits.slice(-10);
  }
  if (digits.startsWith('0') && digits.length > 10) {
    return digits.slice(-10);
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return digits.slice(1);
  }
  return digits.slice(-10);
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return phone;
  const last10 = digits.slice(-10);
  return `${last10.slice(0, 3)} ${last10.slice(3, 6)} ** **`;
}

function mapStatus(dbStatus: string):
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled'
  | 'shipped' {
  const s = (dbStatus || '').toLowerCase();
  if (s === 'pending_payment') return 'pending';
  if (s === 'processing') return 'preparing';
  if (s === 'on_the_way') return 'on_the_way';
  if (s === 'preparing') return 'preparing';
  if (s === 'shipped') return 'shipped';
  if (s === 'delivered') return 'delivered';
  if (s === 'cancelled' || s === 'canceled') return 'cancelled';
  if (s === 'confirmed') return 'confirmed';
  return 'pending';
}

// POST - Sipariş takibi (sipariş numarası + e-posta/telefon ile doğrulama)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const rawOrderNumber = body?.orderNumber;
    const verificationType = body?.verificationType as VerificationType | undefined;
    const verificationValue = getString(body?.verificationValue);

    const orderNumber = Number(rawOrderNumber);

    if (!Number.isFinite(orderNumber)) {
      return NextResponse.json({ error: 'Sipariş numarası gereklidir.' }, { status: 400 });
    }

    if (orderNumber < 100000 || orderNumber > 999999) {
      return NextResponse.json({ error: 'Geçersiz sipariş numarası formatı.' }, { status: 400 });
    }

    if (verificationType !== 'email' && verificationType !== 'phone') {
      return NextResponse.json({ error: 'Doğrulama tipi geçersiz.' }, { status: 400 });
    }

    if (!verificationValue.trim()) {
      return NextResponse.json({ error: 'Doğrulama bilgisi gereklidir.' }, { status: 400 });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 });
    }

    const row = order as unknown as OrderRow;

    // Verification
    let verified = false;

    if (verificationType === 'email') {
      const input = normalizeEmail(verificationValue);
      const orderEmail = normalizeEmail(getString(row.customer_email));
      verified = !!orderEmail && orderEmail === input;
    } else if (verificationType === 'phone') {
      const input = normalizePhone(verificationValue);
      const orderPhone = normalizePhone(getString(row.customer_phone));

      const delivery = getJsonRecord(row.delivery);
      const recipientPhone = normalizePhone(getString(delivery['recipientPhone']));

      verified = (!!recipientPhone && recipientPhone === input) || (!!orderPhone && orderPhone === input);
    }

    if (!verified) {
      return NextResponse.json({ error: 'Doğrulama bilgileri sipariş ile eşleşmiyor.' }, { status: 403 });
    }

    const delivery = getJsonRecord(row.delivery);
    const message = getJsonRecord(row.message);

    const productsRaw = row.products;
    const items = Array.isArray(productsRaw)
      ? (productsRaw as unknown[])
          .filter((p): p is Record<string, unknown> => isRecord(p))
          .map((p) => ({
            productId: Number(p['productId'] ?? p['id'] ?? 0),
            productName: getString(p['name']),
            quantity: Number(p['quantity'] ?? 0),
            price: Number(p['price'] ?? 0),
            image: getString(p['image']),
          }))
      : [];

    const safeOrder = {
      id: row.id,
      orderNumber: row.order_number,
      status: mapStatus(getString(row.status)),
      createdAt: getString(row.created_at),
      deliveryDate: getString(delivery['deliveryDate']) || getString(row.created_at),
      deliveryTimeSlot: getString(delivery['deliveryTimeSlot']) || '11:00-17:00',
      recipientName: getString(delivery['recipientName']) || 'Alıcı',
      recipientPhone: maskPhone(getString(delivery['recipientPhone'])),
      deliveryAddress: getString(delivery['fullAddress']) || getString(delivery['recipientAddress']) || '',
      district: getString(delivery['district']),
      items,
      subtotal: Number(row.subtotal ?? 0),
      deliveryFee: Number(row.delivery_fee ?? 0),
      discount: Number(row.discount ?? 0),
      total: Number(row.total ?? 0),
      paymentMethod: getString(getJsonRecord(row.payment)['method']) || 'credit_card',
      cardMessage: getString(message['content']) || getString(row.notes),
      senderName: getString(message['senderName']),
    };

    return NextResponse.json(safeOrder);
  } catch (error) {
    console.error('Error tracking order:', error);
    return NextResponse.json({ error: 'Sipariş sorgulanamadı.' }, { status: 500 });
  }
}
