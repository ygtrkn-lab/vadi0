-- Add documentation comment for pricing_history category in site_settings
-- This migration doesn't create new tables, just documents the usage pattern

-- Pricing history records are stored in site_settings table with:
-- category: 'pricing_history'
-- key: 'bulk_update_<timestamp>' (e.g., 'bulk_update_1734567890123')
-- value: JSONB containing:
--   {
--     "timestamp": "2025-12-18T10:30:00Z",
--     "operation": "increase" | "decrease",
--     "percentage": 10,
--     "filters": {
--       "category": "guller",
--       "inStock": true,
--       "priceRange": { "min": 100, "max": 1000 }
--     },
--     "productIds": [1, 2, 3] or null,
--     "stats": {
--       "totalProcessed": 100,
--       "successCount": 98,
--       "failedCount": 2
--     }
--   }
-- is_public: false (admin-only access)

-- Example: Insert a sample pricing history record (for documentation purposes)
-- Uncomment the following to create a sample record:
/*
INSERT INTO site_settings (category, key, value, is_public) 
VALUES (
  'pricing_history',
  'bulk_update_example',
  '{
    "timestamp": "2025-12-18T00:00:00Z",
    "operation": "increase",
    "percentage": 15,
    "filters": {"category": "guller"},
    "productIds": null,
    "stats": {
      "totalProcessed": 181,
      "successCount": 181,
      "failedCount": 0
    }
  }'::jsonb,
  false
)
ON CONFLICT (category, key) DO NOTHING;
*/

-- The bulk price update API endpoint automatically creates these records
-- No additional table structure is needed - the existing site_settings table handles it

COMMENT ON TABLE site_settings IS 'Stores all site configuration including pricing history for audit trail';
