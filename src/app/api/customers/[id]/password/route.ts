import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer as supabase } from '@/lib/supabase/server-client';
import bcrypt from 'bcryptjs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { currentPassword, newPassword } = await request.json();

    // Mevcut müşteriyi getir
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('password')
      .eq('id', id)
      .single();

    if (fetchError || !customer) {
      return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 });
    }

    // @ts-ignore - Supabase type generation issue with password field
    const isValid = await bcrypt.compare(currentPassword, customer.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Mevcut şifre yanlış' }, { status: 401 });
    }

    // Yeni şifreyi hash'le
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // @ts-ignore - Supabase type generation issue with password field
    // Güncelle
    const { error: updateError } = await supabase
      .from('customers')
      // @ts-ignore
      .update({
        password: newPasswordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
