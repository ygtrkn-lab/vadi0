const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vtwogsixprzgchuypilh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0d29nc2l4cHJ6Z2NodXlwaWxoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM4ODQ2NiwiZXhwIjoyMDgwOTY0NDY2fQ.u0BNDLfCHOtE_DOa6z8IqUtkPc-etCkXxrE04ZDH6jU',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

(async () => {
  try {
    console.log('🗑️  Tüm yorumlar siliniyor...');
    
    // Tüm yorumları sil
    const { error } = await supabase
      .from('reviews')
      .delete()
      .neq('id', 0); // Tüm satırları sil
    
    if (error) {
      console.log('❌ Hata:', error.message);
      process.exit(1);
    }
    
    // Kontrol et
    const { data } = await supabase
      .from('reviews')
      .select('id', { count: 'exact' });
    
    console.log(`✅ Silindi! Kalan yorum: ${data.length}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Hata:', err.message);
    process.exit(1);
  }
})();
