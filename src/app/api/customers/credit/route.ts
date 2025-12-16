import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase/server-client';
import { toCamelCase } from '@/lib/supabase/transformer';

/**
 * Müşteri hesabına kredi ekle
 * POST /api/customers/credit
 */
export async function POST(request: NextRequest) {
  try {
    const { customerId, amount, reason } = await request.json();

    if (!customerId || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Geçersiz parametreler. customerId ve pozitif amount gereklidir.' },
        { status: 400 }
      );
    }

    // Fetch current customer data from Supabase
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('account_credit, notes')
      .eq('id', customerId)
      .single();

    if (fetchError || !customer) {
      console.error('Error fetching customer:', fetchError);
      return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 });
    }

    // Calculate new credit
    const newCredit = ((customer as any).account_credit || 0) + amount;
    
    // Add timestamp to notes
    const timestamp = new Date().toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    const creditNote = `[${timestamp}] Kredi eklendi: ${amount}₺ - ${reason || 'Sipariş iptali'}`;
    const newNotes = (customer.notes || '').trim() 
      ? `${customer.notes}\n${creditNote}` 
      : creditNote;

    // Update customer in Supabase
    const { data: updatedCustomer, error: updateError } = await supabase
      .from('customers')
      .update({
        account_credit: newCredit,
        notes: newNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating customer credit:', updateError);
      return NextResponse.json({ error: 'Kredi eklenemedi' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${amount}₺ kredi başarıyla eklendi`,
      customer: toCamelCase(updatedCustomer)
    });
  } catch (error) {
    console.error('Error in POST /api/customers/credit:', error);
    return NextResponse.json({ error: 'Kredi eklenemedi' }, { status: 500 });
  }
}
