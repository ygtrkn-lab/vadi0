import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src/data/customers.json');

// Helper to read customers
function readCustomers() {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// POST - Müşteri girişi
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const customers = readCustomers();

    const customer = customers.find(
      (c: { email: string; password: string }) =>
        c.email.toLowerCase() === email.toLowerCase() && c.password === password
    );

    if (!customer) {
      return NextResponse.json(
        { error: 'E-posta veya şifre hatalı.' },
        { status: 401 }
      );
    }

    // isActive alanı yoksa true kabul et (geriye dönük uyumluluk)
    if (customer.isActive === false) {
      return NextResponse.json(
        { error: 'Hesabınız devre dışı bırakılmış.' },
        { status: 403 }
      );
    }

    // Şifreyi response'dan çıkar
    const { password: _, ...customerWithoutPassword } = customer;
    
    return NextResponse.json(customerWithoutPassword);
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
