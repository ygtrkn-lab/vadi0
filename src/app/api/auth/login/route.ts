import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src/data/customers.json');

interface Customer {
  id: string;
  email: string;
  password: string;
  isActive: boolean;
  [key: string]: unknown;
}

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
    
    const data = await fs.readFile(dataFilePath, 'utf-8');
    const customers: Customer[] = JSON.parse(data);
    
    const customer = customers.find(
      (c) => c.email.toLowerCase() === email.toLowerCase() && c.password === password
    );
    
    if (!customer) {
      return NextResponse.json(
        { error: 'E-posta veya şifre hatalı.' },
        { status: 401 }
      );
    }
    
    if (!customer.isActive) {
      return NextResponse.json(
        { error: 'Hesabınız devre dışı bırakılmış.' },
        { status: 403 }
      );
    }
    
    // Şifreyi response'dan çıkar
    const { password: _, ...customerWithoutPassword } = customer;
    
    return NextResponse.json({
      success: true,
      customer: customerWithoutPassword
    });
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json({ error: 'Giriş yapılamadı.' }, { status: 500 });
  }
}
