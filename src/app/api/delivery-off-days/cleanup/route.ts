import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase/admin';

/**
 * Cleanup duplicate off days
 * Removes inactive duplicates for the same date
 * 
 * POST /api/delivery-off-days/cleanup
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Off günleri tablosu temizleniyor...\n');

    // 1. Tüm kayıtları al (inactive dahil, geçmiş dahil)
    const { data: allData, error: fetchError } = await supabaseAdmin
      .from('delivery_off_days')
      .select('*')
      .order('off_date', { ascending: true });

    if (fetchError) {
      console.error('❌ Kayıtlar alınamadı:', fetchError);
      return NextResponse.json(
        { error: 'Kayıtlar alınamadı', details: fetchError.message },
        { status: 500 }
      );
    }

    console.log(`📋 Toplam ${allData.length} kayıt bulundu\n`);

    // 2. Aynı tarihte inactive olanları bul ve sil
    const dateMap = new Map<string, typeof allData>();
    const toDelete: number[] = [];
    let duplicateCount = 0;

    for (const record of allData) {
      const date = record.off_date;
      
      if (!dateMap.has(date)) {
        dateMap.set(date, []);
      }
      
      dateMap.get(date)!.push(record);
    }

    // Aynı tarihte birden fazla kayıt var mı?
    for (const [date, records] of dateMap) {
      if (records.length > 1) {
        duplicateCount++;
        console.log(`⚠️  ${date} tarihinde ${records.length} kayıt var:`);
        
        records.forEach(r => {
          console.log(`   - ID: ${r.id}, Active: ${r.is_active}`);
        });

        // Active olmayan olanları sil
        const inactiveRecords = records.filter(r => !r.is_active);
        inactiveRecords.forEach(r => {
          toDelete.push(r.id);
          console.log(`   ✓ ID ${r.id} silinmek üzere işaretlendi`);
        });

        console.log();
      }
    }

    // 3. Belirlenen kayıtları sil
    let deletedCount = 0;
    if (toDelete.length > 0) {
      console.log(`\n🗑️  ${toDelete.length} kayıt siliniyor...\n`);

      for (const id of toDelete) {
        const { error: deleteError } = await supabaseAdmin
          .from('delivery_off_days')
          .delete()
          .eq('id', id);

        if (deleteError) {
          console.error(`❌ ID ${id} silinemedi:`, deleteError);
        } else {
          console.log(`✓ ID ${id} silindi`);
          deletedCount++;
        }
      }

      console.log(`\n✅ ${deletedCount} kayıt başarıyla silindi`);
    } else {
      console.log('✅ Zaten temiz! Duplicate kayıt yok.');
    }

    return NextResponse.json({
      success: true,
      message: deletedCount > 0 
        ? `${deletedCount} duplicate kayıt temizlendi` 
        : 'Temizlenecek kayıt yok',
      stats: {
        totalRecords: allData.length,
        duplicateDates: duplicateCount,
        deletedRecords: deletedCount,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Cleanup hatası:', error);
    return NextResponse.json(
      { error: 'Cleanup işlemi başarısız oldu', details: String(error) },
      { status: 500 }
    );
  }
}
