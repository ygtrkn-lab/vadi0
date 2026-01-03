import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase/server-client';

// GET - Tek müşteri getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !customer) {
      return NextResponse.json({ error: 'Müşteri bulunamadı.' }, { status: 404 });
    }

    const { password: _pw, ...safeCustomer } = customer as any;
    return NextResponse.json(safeCustomer);
  } catch (error: any) {
    console.error('Error reading customer:', error);
    return NextResponse.json({ error: 'Failed to read customer' }, { status: 500 });
  }
}

// PATCH - Müşteri güncelle
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, phone, email } = body;

    // Supabase'de güncelle
    // @ts-ignore - Supabase type generation issue
    const { data: customer, error } = await supabase
      .from('customers')
      // @ts-ignore
      .update({
        name,
        phone,
        email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { password: _pw, ...safeCustomer } = (customer as any) || {};

    return NextResponse.json({
      success: true,
      customer: safeCustomer,
    });
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Müşteri sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
