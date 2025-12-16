/**
 * Order Number Generator - 6 haneli sıralı sipariş numarası oluşturucu
 * Supabase/Postgres sequence tabanlı numaralandırma (Vercel uyumlu)
 */

import 'server-only';
import supabaseAdmin from '@/lib/supabase/admin';

// Counter yapısı
interface OrderCounter {
  nextOrderNumber: number;
  lastGeneratedAt: string;
  totalOrders: number;
}

async function getTotalOrdersCount(): Promise<number> {
  const { count, error } = await supabaseAdmin.from('orders').select('id', { count: 'exact', head: true });
  if (error) return 0;
  return count || 0;
}

/**
 * Sıradaki sipariş numarasını generate et
 * Otomatik artan 6 haneli sayı (100001, 100002, ...)
 */
export async function generateOrderNumber(): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc('get_next_order_number');
  if (error || data == null) {
    throw new Error(error?.message || 'Failed to generate order number');
  }
  return Number(data);
}

/**
 * Mevcut counter bilgisini getir (yönetim paneli için)
 */
export async function getCounterInfo(): Promise<OrderCounter> {
  const nowIso = new Date().toISOString();

  const { data, error } = await supabaseAdmin.rpc('get_order_number_sequence_state');
  const seqRow = Array.isArray(data) ? data[0] : null;
  const nextOrderNumber = !error && seqRow?.next_value != null ? Number(seqRow.next_value) : 100001;

  return {
    nextOrderNumber,
    lastGeneratedAt: nowIso,
    totalOrders: await getTotalOrdersCount(),
  };
}

/**
 * Counter'ı sıfırla (gerekirse admin işlemi)
 */
export async function resetCounter(startNumber: number = 100001): Promise<OrderCounter> {
  const { error } = await supabaseAdmin.rpc('set_order_number_sequence', { seq_value: startNumber });
  if (error) {
    throw new Error(error.message || 'Failed to reset order number sequence');
  }

  return {
    nextOrderNumber: startNumber,
    lastGeneratedAt: new Date().toISOString(),
    totalOrders: await getTotalOrdersCount(),
  };
}

/**
 * Sipariş numarasının geçerli 6 haneli formatta olup olmadığını kontrol et
 */
export function isValidOrderNumber(orderNumber: number): boolean {
  return orderNumber >= 100000 && orderNumber <= 999999;
}

/**
 * Sipariş numarasını string formatına dönüştür
 */
export function formatOrderNumber(orderNumber: number): string {
  return orderNumber.toString().padStart(6, '0');
}

/**
 * String formatındaki sipariş numarasını number'a dönüştür
 */
export function parseOrderNumber(orderNumberStr: string): number {
  return parseInt(orderNumberStr.replace(/\D/g, ''), 10);
}
