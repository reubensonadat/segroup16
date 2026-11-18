-- ============================================================================
-- RUNWAY — CATALOG SEED (run after schema.sql, in the SQL Editor)
-- ----------------------------------------------------------------------------
-- Puts the full demo catalog into the database WITHOUT the edge function:
--   · 18 products  (6 looks × shirt/pants/shoes) — images are LOCAL frontend
--     paths (/assets/fit-N-*.webp), so nothing is uploaded anywhere
--   · product variants per size (ids follow src/data.ts's scheme)
--   · 6 runway looks, store settings, 4 demo orders
-- Idempotent — safe to run more than once.
-- (Alternative: sign in at #login and use PUSH DATA TO SUPABASE in the
--  dashboard — same result, through the edge function.)
-- ============================================================================

-- ── products ────────────────────────────────────────────────────────────────
insert into public.products (id, name, category, cost_price_ghs, selling_price_ghs, stock_quantity, image, sizes, vendor, assigned_look_id) values
  ('fit-1-shirt', 'Charcoal Heavy Knit Crew',            'Heavyweight Knit',     12, 28.9, 24, '/assets/fit-1-shirt.webp', '{S,M,L,XL}',             'Nike', 1),
  ('fit-1-pants', 'Vintage Washed Relaxed Denim',        'Selvedge Denim',       15, 34.9, 24, '/assets/fit-1-pants.webp', '{S,M,L,XL}',             'Nike', 1),
  ('fit-1-shoes', 'Nike Orbit Agility Low',              'Kinetic Footwear',     15, 36.9, 24, '/assets/fit-1-shoes.webp', '{40,41,42,43,44,45,46}', 'Nike', 1),
  ('fit-2-shirt', 'Combed Organic Boxy Tee',             'Organic Jersey',        7, 15.9, 24, '/assets/fit-2-shirt.webp', '{S,M,L,XL}',             'Nike', 2),
  ('fit-2-pants', 'Easy Straight Leg Chino',             'Daily Tailoring',      10, 24.9, 24, '/assets/fit-2-pants.webp', '{S,M,L,XL}',             'Nike', 2),
  ('fit-2-shoes', 'Air Force 1 ''07 Retro',              'Classic Footwear',     17, 39.9, 24, '/assets/fit-2-shoes.webp', '{40,41,42,43,44,45,46}', 'Nike', 2),
  ('fit-3-shirt', 'Technical Mock Neck Longsleeve',      'Performance Knit',     10, 22.9, 24, '/assets/fit-3-shirt.webp', '{S,M,L,XL}',             'Nike', 3),
  ('fit-3-pants', 'Pleated Tailored Trouser',            'Architectural Pleat',  14, 32.9, 24, '/assets/fit-3-pants.webp', '{S,M,L,XL}',             'Nike', 3),
  ('fit-3-shoes', 'Nike Pegasus Runway Edition',         'Performance Runner',   18, 42.9, 24, '/assets/fit-3-shoes.webp', '{40,41,42,43,44,45,46}', 'Nike', 3),
  ('fit-4-shirt', 'French Terry Zip Overshirt',          'Layering Outerwear',   13, 31.9, 24, '/assets/fit-4-shirt.webp', '{S,M,L,XL}',             'Nike', 4),
  ('fit-4-pants', 'Architectural Cargo Pants',           'Technical Cargo',      13, 29.9, 24, '/assets/fit-4-pants.webp', '{S,M,L,XL}',             'Nike', 4),
  ('fit-4-shoes', 'Nike Dunk Low Grey Fog',              'Low Silhouette',       16, 38.9, 24, '/assets/fit-4-shoes.webp', '{40,41,42,43,44,45,46}', 'Nike', 4),
  ('fit-5-shirt', 'Minimalist Boxy Heavy Tee',           'Drop Shoulder Tee',     7, 16.9, 24, '/assets/fit-5-shirt.webp', '{S,M,L,XL}',             'Nike', 5),
  ('fit-5-pants', 'Relaxed Nylon Track Pant',            'Technical Track',      11, 26.9, 24, '/assets/fit-5-pants.webp', '{S,M,L,XL}',             'Nike', 5),
  ('fit-5-shoes', 'Nike Air Max Triple Black',           'Air Cushion Footwear', 19, 44.9, 24, '/assets/fit-5-shoes.webp', '{40,41,42,43,44,45,46}', 'Nike', 5),
  ('fit-6-shirt', 'Layered Atelier Poplin Shirt',        'Tailored Poplin',      12, 27.9, 24, '/assets/fit-6-shirt.webp', '{S,M,L,XL}',             'Nike', 6),
  ('fit-6-pants', 'Heavyweight Carpenter Denim',         'Workwear Denim',       15, 36.9, 24, '/assets/fit-6-pants.webp', '{S,M,L,XL}',             'Nike', 6),
  ('fit-6-shoes', 'Handcrafted Heritage Lug Boot',       'Leather Footwear',     25, 59.9, 24, '/assets/fit-6-shoes.webp', '{40,41,42,43,44,45,46}', 'Nike', 6)
on conflict (id) do nothing;

-- ── variants (one row per size; ids = 70000000000000 + fit*1000 + slot*100 + idx) ──
insert into public.product_variants (id, product_id, size, price_ghs, stock_quantity)
select
  70000000000000
    + (split_part(p.id, '-', 2)::int) * 1000
    + (case split_part(p.id, '-', 3) when 'shirt' then 200 when 'pants' then 300 else 400 end)
    + g.idx,
  p.id,
  case when split_part(p.id, '-', 3) = 'shoes' then (40 + g.idx)::text
       else (array['S','M','L','XL'])[g.idx + 1] end,
  p.selling_price_ghs,
  4 + g.idx
from public.products p
cross join generate_series(0, 6) as g (idx)
where p.id like 'fit-%'
  and (split_part(p.id, '-', 3) = 'shoes' or g.idx < 4)
on conflict (id) do nothing;

-- ── runway looks (model images = local frontend paths) ─────────────────────
insert into public.runway_looks (id, look_num, name, description, model_image, mode, top_product_id, bottom_product_id, shoes_product_id, active_on_runway) values
  (1, '01', 'The City Edit',    'A charcoal knit and easy denim.',         '/assets/fit-1-model.webp', 3, 'fit-1-shirt', 'fit-1-pants', 'fit-1-shoes', true),
  (2, '02', 'Gallery Opening',  'A clean white tee and relaxed denim.',    '/assets/fit-2-model.webp', 3, 'fit-2-shirt', 'fit-2-pants', 'fit-2-shoes', true),
  (3, '03', 'Gallery Opening',  'Olive knitwear. A grounded palette.',     '/assets/fit-3-model.webp', 3, 'fit-3-shirt', 'fit-3-pants', 'fit-3-shoes', true),
  (4, '04', 'Studio Day',       'Black, white and laid-back denim.',       '/assets/fit-4-model.webp', 3, 'fit-4-shirt', 'fit-4-pants', 'fit-4-shoes', true),
  (5, '05', 'Studio Day',       'Burgundy layers. A tailored perspective.','/assets/fit-5-model.webp', 3, 'fit-5-shirt', 'fit-5-pants', 'fit-5-shoes', true),
  (6, '06', 'Studio Day',       'A grey crew and your favourite denim.',   '/assets/fit-6-model.webp', 3, 'fit-6-shirt', 'fit-6-pants', 'fit-6-shoes', true)
on conflict (id) do nothing;

-- ── store settings (the Admin → Settings defaults) ─────────────────────────
update public.store_settings set
  brand_name                   = 'Around Clothing',
  brand_tagline                = 'Where Fashion Knows No Boundaries · Accra',
  instagram_handle             = '@around_clothingg',
  pickup_address               = 'Oxford Street, Osu Atelier Hub, Accra',
  momo_number                  = '024 555 0192',
  momo_account_name            = 'Around Clothing Ltd',
  support_phone                = '+233 24 555 0192',
  support_email                = 'concierge@aroundclothing.store',
  runway_display_mode          = 3,
  default_bundle_discount_percent = 10,
  per_look_bundle_discounts    = '{}'::jsonb,
  charge_delivery_fee          = true,
  delivery_fee_ghs             = 35,
  free_delivery_threshold_ghs  = 1200,
  delivery_turnaround          = 'Same-day doorstep courier dispatch in Greater Accra',
  pickup_turnaround            = 'Ready for pickup within 2 hours at Osu Flagship',
  currency_code                = 'GHS',
  currency_symbol              = 'GH₵',
  tax_rate_percent             = 0,
  updated_at                   = now()
where id = 1;

-- ── demo orders (jsonb snapshots = exactly what the local store reads) ─────
insert into public.orders (id, created_at, status, payment_method, subtotal, bundle_discount, bundle_name, shipping, tax, total, customer, items) values
  ('RNW-1042', now() - interval '25 minutes',
   'Processing', 'Mobile Money (MTN MoMo)', 28.9, null, null, 0, 0, 28.9,
   '{"fullName":"Ama Serwaa Boateng","phone":"024 555 0182","street":"GPS: 5.5632, -0.1836","city":"East Legon, Accra","country":"Ghana","fulfillment":"delivery"}'::jsonb,
   '[{"id":70000000001301,"productId":"fit-1-shirt","name":"Charcoal Heavy Knit Crew","size":"M","price":28.9,"quantity":1,"image":"/assets/fit-1-shirt.webp"}]'::jsonb),
  ('RNW-1017', now() - interval '3.5 hours',
   'Ready for Pickup', 'Mobile Money (Telecel Cash)', 40.8, 4.08, 'Look 02 — Gallery Opening', 0, 0, 36.72,
   '{"fullName":"Kwesi Mensah","phone":"020 411 7723","street":"Osu Oxford Street Hub","city":"Accra","country":"Ghana","fulfillment":"pickup"}'::jsonb,
   '[{"id":70000000002202,"productId":"fit-2-shirt","name":"Combed Organic Boxy Tee","size":"L","price":15.9,"quantity":1,"image":"/assets/fit-2-shirt.webp"},{"id":70000000002302,"productId":"fit-2-pants","name":"Easy Straight Leg Chino","size":"L","price":24.9,"quantity":1,"image":"/assets/fit-2-pants.webp"}]'::jsonb),
  ('RNW-0984', now() - interval '26 hours',
   'In Transit', 'Mobile Money (MTN MoMo)', 65.8, null, null, 3.5, 0, 69.3,
   '{"fullName":"Naa Adjeley Quaye","phone":"055 290 6614","street":"12 Bamboo Ave, Airport Residential","city":"Accra","country":"Ghana","fulfillment":"delivery"}'::jsonb,
   '[{"id":70000000003202,"productId":"fit-3-shirt","name":"Technical Mock Neck Longsleeve","size":"L","price":22.9,"quantity":1,"image":"/assets/fit-3-shirt.webp"},{"id":70000000003402,"productId":"fit-3-shoes","name":"Nike Pegasus Runway Edition","size":"42","price":42.9,"quantity":1,"image":"/assets/fit-3-shoes.webp"}]'::jsonb),
  ('RNW-0921', now() - interval '62 hours',
   'Delivered', 'Mobile Money (AT Money)', 26.9, null, null, 0, 0, 26.9,
   '{"fullName":"Yaw Owusu-Ansah","phone":"027 833 4409","street":"5 Thurston Gardens, Cantonments","city":"Accra","country":"Ghana","fulfillment":"delivery"}'::jsonb,
   '[{"id":70000000005302,"productId":"fit-5-pants","name":"Relaxed Nylon Track Pant","size":"L","price":26.9,"quantity":1,"image":"/assets/fit-5-pants.webp"}]'::jsonb)
on conflict (id) do nothing;
