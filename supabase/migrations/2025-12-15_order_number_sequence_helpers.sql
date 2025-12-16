-- Migration: Order number sequence helpers
-- Date: 2025-12-15
-- Description: Makes order_number generation and maintenance fully Supabase/Postgres-based (Vercel-safe)

-- Ensure sequence exists (SERIAL creates: orders_order_number_seq)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S'
      AND c.relname = 'orders_order_number_seq'
      AND n.nspname = 'public'
  ) THEN
    CREATE SEQUENCE public.orders_order_number_seq START WITH 100001 INCREMENT BY 1 MINVALUE 100001;
  END IF;
END $$;

-- Ensure orders.order_number uses the sequence by default
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'order_number'
  ) THEN
    EXECUTE 'ALTER TABLE public.orders ALTER COLUMN order_number SET DEFAULT nextval(''public.orders_order_number_seq''::regclass)';
  END IF;
END $$;

-- Keep sequence at least max(order_number)+1 (best effort)
DO $$
DECLARE
  max_no bigint;
  next_no bigint;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='orders') THEN
    SELECT COALESCE(MAX(order_number), 100000) INTO max_no FROM public.orders;
    next_no := GREATEST(max_no + 1, 100001);
    PERFORM setval('public.orders_order_number_seq', next_no, false);
  END IF;
END $$;

-- Returns the next order number WITHOUT incrementing
CREATE OR REPLACE FUNCTION public.get_order_number_sequence_state()
RETURNS TABLE(last_value bigint, is_called boolean, next_value bigint)
LANGUAGE sql
AS $$
  SELECT
    s.last_value,
    s.is_called,
    CASE WHEN s.is_called THEN s.last_value + 1 ELSE s.last_value END AS next_value
  FROM public.orders_order_number_seq s;
$$;

-- Returns and increments the next order number (useful for scripts)
CREATE OR REPLACE FUNCTION public.get_next_order_number()
RETURNS bigint
LANGUAGE sql
AS $$
  SELECT nextval('public.orders_order_number_seq');
$$;

-- Sets the next order number (seq_value will be returned on next call)
CREATE OR REPLACE FUNCTION public.set_order_number_sequence(seq_value bigint)
RETURNS void
LANGUAGE sql
AS $$
  SELECT setval('public.orders_order_number_seq', seq_value, false);
$$;

-- Permissions: only service_role can use these helpers
REVOKE ALL ON FUNCTION public.get_order_number_sequence_state() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_next_order_number() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_order_number_sequence(bigint) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_order_number_sequence_state() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_next_order_number() TO service_role;
GRANT EXECUTE ON FUNCTION public.set_order_number_sequence(bigint) TO service_role;
