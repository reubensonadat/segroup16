-- ============================================================================
-- RUNWAY x SUPABASE — clean schema (re-runnable, self-cleaning)
-- ----------------------------------------------------------------------------
-- Run this WHOLE file in the Supabase SQL Editor. It:
--   1. DROPS every leftover table from earlier experiments (categories /
--      products / product_images / customers / orders / order_items …),
--   2. Creates the Runway schema that mirrors the app's local stores,
--   3. Locks everything down with RLS (public = read-only storefront),
--   4. Seeds ONLY the admin login: phone 0541651298 (→ 233541651298).
--
-- Catalog data (products, looks, orders, settings) is NOT seeded here — it
-- lives in the app, and the admin dashboard's "PUSH DATA TO SUPABASE" button
-- uploads it through the admin-auth edge function (service role). Images
-- stay local in /assets — nothing to upload.
-- ============================================================================

-- ── 0) SPRING CLEANING — drop anything old, in FK-safe order ───────────────
drop table if exists public.order_items       cascade;
drop table if exists public.product_images    cascade;
drop table if exists public.categories        cascade;
drop table if exists public.orders            cascade;
drop table if exists public.customers         cascade;
drop table if exists public.products          cascade;
drop table if exists public.order_bundles     cascade;
drop table if exists public.order_status_events cascade;
drop table if exists public.runway_looks      cascade;
drop table if exists public.product_variants  cascade;
drop table if exists public.store_settings    cascade;
drop table if exists public.admin_sessions    cascade;
drop table if exists public.otp_codes         cascade;
drop table if exists public.admin_users       cascade;

-- ────────────────────────────────────────────────────────────────────────────
-- 1) STORE SETTINGS — single row, the boss (Admin → Settings)
-- ────────────────────────────────────────────────────────────────────────────
create table public.store_settings (
  id                              int primary key default 1 check (id = 1),
  brand_name                      text not null default 'Around Clothing',
  brand_tagline                   text not null default '',
  instagram_handle                text not null default '',
  pickup_address                  text not null default '',
  momo_number                     text not null default '',
  momo_account_name               text not null default '',
  support_phone                   text not null default '',
  support_email                   text not null default '',
  runway_display_mode             int  not null default 3 check (runway_display_mode between 1 and 3),
  default_bundle_discount_percent numeric not null default 10,
  per_look_bundle_discounts       jsonb not null default '{}'::jsonb,
  charge_delivery_fee             boolean not null default true,
  delivery_fee_ghs                numeric not null default 35,
  free_delivery_threshold_ghs     numeric not null default 1200,
  delivery_turnaround             text not null default '',
  pickup_turnaround               text not null default '',
  currency_code                   text not null default 'GHS',
  currency_symbol                 text not null default 'GH₵',
  tax_rate_percent                numeric not null default 0,
  updated_at                      timestamptz not null default now()
);
insert into public.store_settings (id) values (1);

-- ────────────────────────────────────────────────────────────────────────────
-- 2) CATALOG — products & per-size variants
--    (mirrors ManagedProduct in src/products-store.ts)
-- ────────────────────────────────────────────────────────────────────────────
create table public.products (
  id                text primary key,                        -- 'fit-1-shirt'
  name              text not null,
  category          text not null default 'Apparel',
  cost_price_ghs    numeric not null default 0,
  selling_price_ghs numeric not null default 0,
  stock_quantity    int not null default 0,
  image             text not null default '',                -- local '/assets/…' path (images stay local)
  sizes             text[] not null default '{}',
  has_sizes         boolean not null default true,
  specs             jsonb not null default '{}'::jsonb,
  description       text,
  vendor            text not null default 'Nike',
  assigned_look_id  int,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.product_variants (
  id             bigint primary key,                         -- data.ts scheme: 70000000000000 + fit*1000 + slot*100 + idx
  product_id     text not null references public.products (id) on delete cascade,
  size           text not null,
  price_ghs      numeric not null,
  stock_quantity int not null default 6
);

-- ────────────────────────────────────────────────────────────────────────────
-- 3) RUNWAY LOOKS — the outfits on the 3D stage (max 12)
--    (mirrors ManagedRunwayLook in src/products-store.ts)
-- ────────────────────────────────────────────────────────────────────────────
create table public.runway_looks (
  id                int primary key,                          -- 1..12
  look_num          text not null,
  name              text not null,
  description       text not null default '',
  model_image       text not null default '',                 -- local '/assets/fit-N-model.webp'
  mode              int not null default 3 check (mode between 1 and 3),
  top_product_id    text references public.products (id),
  bottom_product_id text references public.products (id),
  shoes_product_id  text references public.products (id),
  active_on_runway  boolean not null default true
);

-- ────────────────────────────────────────────────────────────────────────────
-- 4) SALES — orders with jsonb snapshots (what the local Order[] store reads)
-- ────────────────────────────────────────────────────────────────────────────
create table public.customers (
  id                    uuid primary key default gen_random_uuid(),
  full_name             text not null,
  phone                 text,
  email                 text,
  street                text,
  city                  text,
  country               text default 'Ghana',
  latitude              double precision,
  longitude             double precision,
  preferred_fulfillment text not null default 'delivery' check (preferred_fulfillment in ('delivery', 'pickup')),
  created_at            timestamptz not null default now()
);

create table public.orders (
  id              text primary key,                           -- 'RNW-1042'
  customer_id     uuid references public.customers (id),
  created_at      timestamptz not null default now(),
  status          text not null default 'Processing'
                  check (status in ('Processing','Shipped','In Transit','Out for Delivery',
                                    'Ready for Pickup','Delivered','Collected','Cancelled')),
  payment_method  text not null default 'Mobile Money (MTN MoMo)',
  subtotal        numeric not null default 0,
  bundle_discount numeric,
  bundle_name     text,
  shipping        numeric not null default 0,
  tax             numeric not null default 0,
  total           numeric not null default 0,
  customer        jsonb not null default '{}'::jsonb,         -- CustomerInfo snapshot
  items           jsonb not null default '[]'::jsonb          -- OrderItem[] snapshot
);

create index orders_created_at_idx on public.orders (created_at desc);

create table public.order_items (
  id             bigint generated always as identity primary key,
  order_id       text not null references public.orders (id) on delete cascade,
  variant_id     bigint references public.product_variants (id),
  product_id     text references public.products (id),
  product_name   text not null,
  size           text not null,
  unit_price_ghs numeric not null,
  quantity       int not null default 1
);

create table public.order_bundles (
  id                  bigint generated always as identity primary key,
  order_id            text not null references public.orders (id) on delete cascade,
  look_id             int references public.runway_looks (id),
  bundle_name         text not null,
  discount_percent    numeric not null default 10,
  discount_amount_ghs numeric not null default 0
);

create table public.order_status_events (
  id         bigint generated always as identity primary key,
  order_id   text not null references public.orders (id) on delete cascade,
  status     text not null,
  note       text,
  created_at timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────────────────
-- 5) ADMIN OTP LOGIN (Kola staff-auth port)
--    Only phones in admin_users can receive codes; codes are SHA-256 hashed;
--    sessions are uuid rows with 12h expiry — all enforced by the edge function.
-- ────────────────────────────────────────────────────────────────────────────
create table public.admin_users (
  id         uuid primary key default gen_random_uuid(),
  phone      text unique not null,                            -- normalized 233XXXXXXXXX
  full_name  text not null,
  role       text not null default 'owner' check (role in ('owner', 'staff')),
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- ▼▼▼ THE DEMO ADMIN — your number, 0541651298 ▼▼▼
insert into public.admin_users (phone, full_name, role)
values ('233541651298', 'Runway Admin', 'owner')
on conflict (phone) do nothing;

create table public.otp_codes (
  id          bigint generated always as identity primary key,
  phone       text not null,
  code_hash   text not null,                                  -- sha256('phone:code')
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  attempts    int not null default 0,
  created_at  timestamptz not null default now()
);
create index otp_codes_live_idx on public.otp_codes (phone) where consumed_at is null;

create table public.admin_sessions (
  token      uuid primary key default gen_random_uuid(),
  admin_id   uuid not null references public.admin_users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index admin_sessions_admin_idx on public.admin_sessions (admin_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 6) ROW LEVEL SECURITY
--    · anon/authenticated can READ storefront tables (public shop + #track
--      page) and nothing else. Zero write policies → the anon key can never
--      mutate data. All writes go through the admin-auth edge function's
--      service role (OTP-gated), incl. the dashboard's "push data" button.
-- ────────────────────────────────────────────────────────────────────────────
alter table public.store_settings      enable row level security;
alter table public.products            enable row level security;
alter table public.product_variants    enable row level security;
alter table public.runway_looks        enable row level security;
alter table public.customers           enable row level security;
alter table public.orders              enable row level security;
alter table public.order_items         enable row level security;
alter table public.order_bundles       enable row level security;
alter table public.order_status_events enable row level security;
alter table public.admin_users         enable row level security;
alter table public.otp_codes           enable row level security;
alter table public.admin_sessions      enable row level security;

create policy "Public read store settings"  on public.store_settings      for select to anon, authenticated using (true);
create policy "Public read products"        on public.products            for select to anon, authenticated using (true);
create policy "Public read variants"        on public.product_variants    for select to anon, authenticated using (true);
create policy "Public read runway looks"    on public.runway_looks        for select to anon, authenticated using (true);
create policy "Public read orders"          on public.orders              for select to anon, authenticated using (true);
create policy "Public read order items"     on public.order_items         for select to anon, authenticated using (true);
create policy "Public read order bundles"   on public.order_bundles       for select to anon, authenticated using (true);
create policy "Public read status events"   on public.order_status_events for select to anon, authenticated using (true);

-- NOTE: public.customers / admin_users / otp_codes / admin_sessions keep RLS
-- enabled with ZERO policies → invisible to the anon key entirely.

-- (No storage buckets are created: images live in the frontend's local
--  /assets folder and the DB stores only their local paths. If you ever want
--  a cloud copy, scripts/upload-assets.ts creates the bucket for you.)
