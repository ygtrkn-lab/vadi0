/*
  ❌ DOĞRULANMAMIŞ ALIŞVERIŞ YORUMLARINI SİL
  
  Kullanım:
    node remove-unverified-reviews.js --confirm=true
*/

const { createClient } = require('@supabase/supabase-js');

const argv = process.argv.slice(2).reduce((acc, arg) => {
  const [k, v] = arg.split('=');
  const key = k.replace(/^--/, '');
  acc[key] = v === undefined ? true : v;
  return acc;
}, {});

const CONFIRM = String(argv['confirm'] ?? 'false').toLowerCase() === 'true';

const supabase = createClient(
  'https://vtwogsixprzgchuypilh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0d29nc2l4cHJ6Z2NodXlwaWxoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM4ODQ2NiwiZXhwIjoyMDgwOTY0NDY2fQ.u0BNDLfCHOtE_DOa6z8IqUtkPc-etCkXxrE04ZDH6jU',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

(async () => {
  try {
    console.log('🔍 Doğrulanmamış alışveriş yorumları taranıyor...\n');
    
    const { data: unverified, error: fetchError } = await supabase
      .from('reviews')
      .select('id', { count: 'exact' })
      .eq('is_verified_purchase', false);

    if (fetchError) {
      console.error('❌ Hata:', fetchError);
      process.exit(1);
    }

    if (!unverified || unverified.length === 0) {
      console.log('✅ Silinecek doğrulanmamış yorum yok.');
      process.exit(0);
    }

    console.log(`⚠️  ${unverified.length} doğrulanmamış yorum silinecektir.\n`);

    if (!CONFIRM) {
      console.log('🔒 Komutu çalıştırmak için: node remove-unverified-reviews.js --confirm=true');
      process.exit(0);
    }

    const unverifiedIds = unverified.map(r => r.id);

    // Batch delete
    for (let i = 0; i < unverifiedIds.length; i += 1000) {
      const batch = unverifiedIds.slice(i, i + 1000);
      const { error: deleteError } = await supabase
        .from('reviews')
        .delete()
        .in('id', batch);

      if (deleteError) {
        console.error('❌ Silme hatası:', deleteError);
        process.exit(1);
      }

      console.log(`✅ ${Math.min(i + 1000, unverifiedIds.length)} / ${unverifiedIds.length} yorum silindi`);
    }

    console.log(`\n✨ ${unverifiedIds.length} doğrulanmamış yorum başarıyla silindi! 🎉`);
    process.exit(0);

  } catch (err) {
    console.error('❌ Hata:', err.message);
    process.exit(1);
  }
})();
