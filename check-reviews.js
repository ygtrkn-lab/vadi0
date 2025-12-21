const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://vtwogsixprzgchuypilh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0d29nc2l4cHJ6Z2NodXlwaWxoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM4ODQ2NiwiZXhwIjoyMDgwOTY0NDY2fQ.u0BNDLfCHOtE_DOa6z8IqUtkPc-etCkXxrE04ZDH6jU',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

(async () => {
  const { data, error } = await supabase
    .from('reviews')
    .select('id', { count: 'exact' });

  if (error) {
    console.log('❌ HATA:', error.message);
  } else {
    console.log('✅ Veritabanında toplam yorum sayısı:', data.length);
    if (data.length === 0) {
      console.log('✓ Yorumlar başarıyla silindi!');
    } else {
      console.log('⚠️  Hala yorumlar var!');
    }
  }
  process.exit(0);
})();
