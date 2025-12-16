import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src/data/customers.json');

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
    
    const data = await fs.readFile(dataFilePath, 'utf-8');
    const customers: Customer[] = JSON.parse(data);
    
    // E-posta kontrolü
    const existingCustomer = customers.find(
      (c) => c.email.toLowerCase() === email.toLowerCase()
    );
    
    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Bu e-posta adresi zaten kayıtlı.' },
        { status: 400 }
      );
    }
    
    // Yeni müşteri oluştur
    const newCustomer: Customer = {
      id: 'cust_' + Date.now().toString(36) + Math.random().toString(36).substr(2),
      email,
      name,
      phone,
      password, // Gerçek uygulamada hash'lenmeli!
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      addresses: [],
      orders: [],
      favorites: [],
      totalSpent: 0,
      orderCount: 0,
      lastOrderDate: null,
      isActive: true,
      notes: '',
      tags: ['Yeni']
    };
    
    customers.push(newCustomer);
    await fs.writeFile(dataFilePath, JSON.stringify(customers, null, 2), 'utf-8');
    
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
