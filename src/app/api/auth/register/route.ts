import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase/admin';

interface Customer {
  id: string;
  email: string;
  name: string;
  phone: string;
  password: string;
  createdAt: string;
  updatedAt: string;
  addresses: never[];
  orders: never[];
  favorites: never[];
  totalSpent: number;
  orderCount: number;
  lastOrderDate: null;
  isActive: boolean;
  notes: string;
  tags: string[];
}

// POST - Kayıt ol
export async function POST(request: NextRequest) {
  try {
    const { email, name, phone, password } = await request.json();
    
    // Validasyon
    if (!email || !name || !phone || !password) {
      return NextResponse.json(
        { error: 'Tüm alanları doldurun.' },
        { status: 400 }
      );
    }
    
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Şifre en az 6 karakter olmalıdır.' },
        { status: 400 }
      );
    }
    
    // E-posta kontrolü
    const normalizedEmail = String(email).toLowerCase();
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('email', normalizedEmail)
      .limit(1)
      .maybeSingle();

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi zaten kayıtlı.' },
        { status: 400 }
      );
    }
    
    // Yeni müşteri oluştur
    const newCustomerId = 'cust_' + Date.now().toString(36) + Math.random().toString(36).slice(2);
    const now = new Date().toISOString();

    const newCustomer: Customer = {
      id: newCustomerId,
      email: normalizedEmail,
      name,
      phone,
      password, // TODO: hash (kept for backwards compatibility)
      createdAt: now,
      updatedAt: now,
      addresses: [],
      orders: [],
      favorites: [],
      totalSpent: 0,
      orderCount: 0,
      lastOrderDate: null,
      isActive: true,
      notes: '',
      tags: ['Yeni'],
    };

    const { error: insertError } = await supabaseAdmin
      .from('customers')
      .insert({
        id: newCustomer.id,
        email: newCustomer.email,
        name: newCustomer.name,
        phone: newCustomer.phone,
        password: newCustomer.password,
        addresses: newCustomer.addresses,
        orders: newCustomer.orders,
        favorites: newCustomer.favorites,
        created_at: newCustomer.createdAt,
        updated_at: newCustomer.updatedAt,
        total_spent: newCustomer.totalSpent,
        order_count: newCustomer.orderCount,
        last_order_date: newCustomer.lastOrderDate,
        is_active: newCustomer.isActive,
        notes: newCustomer.notes,
        tags: newCustomer.tags,
      });

    if (insertError) {
      console.error('Customer insert error:', insertError);
      return NextResponse.json({ error: 'Kayıt yapılamadı.' }, { status: 500 });
    }
    
    // Şifreyi response'dan çıkar
    const { password: _, ...customerWithoutPassword } = newCustomer;
    
    return NextResponse.json({
      success: true,
      customer: customerWithoutPassword
    }, { status: 201 });
  } catch (error) {
    console.error('Error during registration:', error);
    return NextResponse.json({ error: 'Kayıt yapılamadı.' }, { status: 500 });
  }
}
