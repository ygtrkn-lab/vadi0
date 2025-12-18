import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase/admin';

type CustomerRow = {
  id: string;
  email: string;
  password: string;
  is_active: boolean | null;
  [key: string]: unknown;
};

// POST - Giriş yap
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-posta ve şifre gereklidir.' },
        { status: 400 }
      );
    }
    
    const { data: customer, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('email', String(email).toLowerCase())
      .eq('password', password)
      .limit(1)
      .single();

    if (error || !customer) {
      return NextResponse.json(
        { error: 'E-posta veya şifre hatalı.' },
        { status: 401 }
      );
    }
    
    const row = customer as unknown as CustomerRow;

    if (row.is_active === false) {
      return NextResponse.json(
        { error: 'Hesabınız devre dışı bırakılmış.' },
        { status: 403 }
      );
    }
    
    // Şifreyi response'dan çıkar
    const { password: _, ...customerWithoutPassword } = row;
    
    return NextResponse.json({
      success: true,
      customer: customerWithoutPassword
    });
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json({ error: 'Giriş yapılamadı.' }, { status: 500 });
  }
}
