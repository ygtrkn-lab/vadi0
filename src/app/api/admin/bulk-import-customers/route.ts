import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting bulk customer import...');
    
    // Read customers data
    const customersPath = path.join(process.cwd(), 'src', 'data', 'customers.json');
    
    if (!fs.existsSync(customersPath)) {
      return NextResponse.json({ 
        success: false, 
        error: 'customers.json not found.' 
      }, { status: 400 });
    }
    
    const customersData = JSON.parse(fs.readFileSync(customersPath, 'utf-8'));
    
    // Get existing customers (check both id and email for uniqueness)
    const { data: existingCustomers, error: fetchError } = await supabase
      .from('customers')
      .select('id, email');
    
    if (fetchError) {
      console.error('❌ Error fetching existing customers:', fetchError);
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }
    
    const existingIds = new Set(existingCustomers?.map(c => c.id) || []);
    const existingEmails = new Set(existingCustomers?.map(c => c.email.toLowerCase()) || []);
    console.log(`✅ Found ${existingIds.size} existing customers (${existingEmails.size} unique emails)`);
    
    // Filter new customers (must have unique id AND email)
    const filteredCustomers = customersData.filter((c: any) =>
      !existingIds.has(c.id) && !existingEmails.has(c.email.toLowerCase())
    );
    
    // Deduplicate by email within new customers (keep first occurrence)
    const seenEmails = new Set<string>();
    const newCustomers = filteredCustomers.filter((c: any) => {
      const email = c.email.toLowerCase();
      if (seenEmails.has(email)) {
        console.log(`⚠️ Skipping duplicate email in source data: ${email}`);
        return false;
      }
      seenEmails.add(email);
      return true;
    });
    
    console.log(`📈 ${newCustomers.length} new customers to insert (filtered ${filteredCustomers.length - newCustomers.length} duplicate emails)`);
    
    if (newCustomers.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'All customers already exist in database',
        stats: { total: customersData.length, existing: existingIds.size, inserted: 0 }
      });
    }
    
    // Transform customers to Supabase format
    const customersToInsert = newCustomers.map((c: any) => ({
      id: c.id,
      email: c.email.toLowerCase(),
      name: c.name,
      phone: c.phone,
      password: c.password,
      addresses: c.addresses || [],
      orders: c.orders || [],
      favorites: c.favorites || [],
      created_at: c.createdAt,
      updated_at: c.updatedAt,
      total_spent: c.totalSpent || 0,
      order_count: c.orderCount || 0,
      last_order_date: c.lastOrderDate || null,
      is_active: c.isActive !== false,
      notes: c.notes || '',
      tags: c.tags || [],
      account_credit: c.accountCredit || 0
    }));
    
    // Insert in batches of 50
    const BATCH_SIZE = 50;
    let inserted = 0;
    let failed = 0;
    const errors: any[] = [];
    
    for (let i = 0; i < customersToInsert.length; i += BATCH_SIZE) {
      const batch = customersToInsert.slice(i, i + BATCH_SIZE);
      console.log(`📦 Inserting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(customersToInsert.length / BATCH_SIZE)} (${batch.length} customers)`);
      
      const { data, error } = await supabase
        .from('customers')
        .insert(batch)
        .select();
      
      if (error) {
        console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message);
        failed += batch.length;
        errors.push({ batch: Math.floor(i / BATCH_SIZE) + 1, error: error.message });
      } else {
        console.log(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} inserted successfully`);
        inserted += batch.length;
      }
      
      // Rate limiting
      if (i + BATCH_SIZE < customersToInsert.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    console.log(`\n📊 Results: Inserted ${inserted}, Failed ${failed}`);
    
    return NextResponse.json({
      success: true,
      message: `Bulk import completed: ${inserted} customers inserted, ${failed} failed`,
      stats: {
        total: customersData.length,
        existing: existingIds.size,
        inserted,
        failed
      },
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error: any) {
    console.error('💥 Fatal error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
