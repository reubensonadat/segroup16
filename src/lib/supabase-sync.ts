/**
 * Supabase ⇄ local stores wiring.
 *
 * PULL (automatic on boot): DB rows → the EXISTING local persistence
 * functions, so the whole app (runway, admin desk, cart, track) keeps
 * working exactly as before — the database just replaces the seed data.
 *
 * PUSH (the dashboard button): the app's CURRENT local data → the database,
 * through the admin-auth edge function with the OTP session token (RLS keeps
 * the anon key read-only). Images are NEVER pushed — they stay local in
 * /assets and the DB stores only their local paths.
 *
 * Both are no-ops when the Supabase env vars are missing.
 */
import { getSupabase, callAdminAuth, getSupabaseEnv } from './supabase';
import { getAdminSession } from '../auth';
import {
    getManagedProducts,
    getManagedRunwayLooks,
    saveManagedProducts,
    saveManagedRunwayLooks,
    type ManagedProduct,
    type ManagedRunwayLook,
} from '../products-store';
import { getOrders, saveOrders, type Order, type OrderStatus } from '../orders-store';
import { DEFAULT_STORE_CONFIG, getStoreConfig, updateStoreConfig, type StoreConfig } from '../store-config';

export interface SupabaseSyncReport {
    products: number;
    looks: number;
    orders: number;
    settings: boolean;
}

/** Fetch every storefront table and inject the rows into local state. */
export async function pullAllFromSupabase(): Promise<SupabaseSyncReport | null> {
    const db = getSupabase();
    if (!db) return null;

    const [productsRes, looksRes, ordersRes, settingsRes] = await Promise.all([
        db.from('products').select('*'),
        db.from('runway_looks').select('*').order('id'),
        db.from('orders').select('*').order('created_at', { ascending: false }),
        db.from('store_settings').select('*').eq('id', 1).maybeSingle(),
    ]);

    if (productsRes.error) throw new Error(productsRes.error.message);
    if (looksRes.error) throw new Error(looksRes.error.message);
    if (ordersRes.error) throw new Error(ordersRes.error.message);

    // ── products → ManagedProduct[] ────────────────────────────────────────
    const products: ManagedProduct[] = (productsRes.data ?? []).map((row: Record<string, unknown>) => ({
        id: String(row.id),
        name: String(row.name ?? ''),
        category: String(row.category ?? 'Apparel'),
        costPriceGhs: Number(row.cost_price_ghs ?? 0),
        sellingPriceGhs: Number(row.selling_price_ghs ?? 0),
        stockQuantity: Number(row.stock_quantity ?? 0),
        image: String(row.image ?? ''),
        sizes: Array.isArray(row.sizes) ? (row.sizes as string[]) : [],
        hasSizes: row.has_sizes === undefined ? true : Boolean(row.has_sizes),
        specs: (row.specs as Record<string, string> | null) ?? undefined,
        description: (row.description as string | null) ?? undefined,
        vendor: String(row.vendor ?? 'Nike'),
        assignedLookId: row.assigned_look_id != null ? Number(row.assigned_look_id) : undefined,
    }));
    if (products.length > 0) saveManagedProducts(products);

    // ── runway_looks → ManagedRunwayLook[] ─────────────────────────────────
    const looks: ManagedRunwayLook[] = (looksRes.data ?? []).map((row: Record<string, unknown>) => ({
        id: Number(row.id),
        lookNum: String(row.look_num ?? ''),
        name: String(row.name ?? ''),
        description: String(row.description ?? ''),
        modelImage: String(row.model_image ?? ''),
        mode: (Number(row.mode ?? 3) || 3) as ManagedRunwayLook['mode'],
        topProductId: String(row.top_product_id ?? ''),
        bottomProductId: (row.bottom_product_id as string | null) ?? undefined,
        shoesProductId: (row.shoes_product_id as string | null) ?? undefined,
        activeOnRunway: Boolean(row.active_on_runway),
    }));
    if (looks.length > 0) saveManagedRunwayLooks(looks);

    // ── orders → Order[] (jsonb snapshots rebuild them verbatim) ───────────
    const orders: Order[] = (ordersRes.data ?? []).map((row: Record<string, unknown>) => ({
        id: String(row.id),
        createdAt: String(row.created_at ?? new Date().toISOString()),
        customer: row.customer as Order['customer'],
        items: Array.isArray(row.items) ? (row.items as Order['items']) : [],
        subtotal: Number(row.subtotal ?? 0),
        bundleDiscount: row.bundle_discount != null ? Number(row.bundle_discount) : undefined,
        bundleName: (row.bundle_name as string | null) ?? undefined,
        shipping: Number(row.shipping ?? 0),
        tax: Number(row.tax ?? 0),
        total: Number(row.total ?? 0),
        status: String(row.status ?? 'Processing') as OrderStatus,
        paymentMethod: String(row.payment_method ?? ''),
    }));
    if (orders.length > 0) saveOrders(orders);

    // ── store_settings → StoreConfig patch ─────────────────────────────────
    let settings = false;
    const s = settingsRes.data as Record<string, unknown> | null;
    if (s) {
        const patch: Partial<StoreConfig> = {
            brandName: String(s.brand_name ?? DEFAULT_STORE_CONFIG.brandName),
            brandTagline: String(s.brand_tagline ?? ''),
            instagramHandle: String(s.instagram_handle ?? ''),
            pickupAddress: String(s.pickup_address ?? ''),
            momoNumber: String(s.momo_number ?? ''),
            momoAccountName: String(s.momo_account_name ?? ''),
            supportPhone: String(s.support_phone ?? ''),
            supportEmail: String(s.support_email ?? ''),
            runwayDisplayMode: (Number(s.runway_display_mode ?? 3) || 3) as StoreConfig['runwayDisplayMode'],
            defaultBundleDiscountPercent: Number(s.default_bundle_discount_percent ?? 10),
            perLookBundleDiscounts: (s.per_look_bundle_discounts as Record<string, number> | null) ?? {},
            chargeDeliveryFee: Boolean(s.charge_delivery_fee),
            deliveryFeeGhs: Number(s.delivery_fee_ghs ?? 35),
            freeDeliveryThresholdGhs: Number(s.free_delivery_threshold_ghs ?? 1200),
            deliveryTurnaround: String(s.delivery_turnaround ?? ''),
            pickupTurnaround: String(s.pickup_turnaround ?? ''),
            currencyCode: String(s.currency_code ?? 'GHS'),
            currencySymbol: String(s.currency_symbol ?? 'GH₵'),
            taxRatePercent: Number(s.tax_rate_percent ?? 0),
        };
        updateStoreConfig(patch);
        settings = true;
    }

    // Re-render whatever is on screen right now with the fresh data.
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('runway:products-updated'));
        window.dispatchEvent(new CustomEvent('runway:looks-updated'));
    }

    return { products: products.length, looks: looks.length, orders: orders.length, settings };
}

export interface SupabasePushReport {
    products: number;
    looks: number;
    orders: number;
    settings: boolean;
}

/**
 * Push the app's CURRENT local data into Supabase (text data only — image
 * paths stay local). Requires an OTP admin session; returns null when
 * Supabase isn't configured or nobody is signed in.
 */
export async function pushAllToSupabase(): Promise<SupabasePushReport | null> {
    const { configured } = getSupabaseEnv();
    const session = getAdminSession();
    if (!configured || !session) return null;

    const products = getManagedProducts().map((p: ManagedProduct) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        cost_price_ghs: p.costPriceGhs,
        selling_price_ghs: p.sellingPriceGhs,
        stock_quantity: p.stockQuantity,
        image: p.image, // local '/assets/…' path — never uploaded anywhere
        sizes: p.sizes,
        has_sizes: p.hasSizes ?? p.sizes.length > 0,
        specs: p.specs ?? {},
        description: p.description ?? null,
        vendor: p.vendor,
        assigned_look_id: p.assignedLookId ?? null,
    }));

    const looks = getManagedRunwayLooks().map((l: ManagedRunwayLook) => ({
        id: l.id,
        look_num: l.lookNum,
        name: l.name,
        description: l.description,
        model_image: l.modelImage, // local path, stays frontend-side
        mode: l.mode ?? 3,
        top_product_id: l.topProductId || null,
        bottom_product_id: l.bottomProductId || null,
        shoes_product_id: l.shoesProductId || null,
        active_on_runway: l.activeOnRunway,
    }));

    const orders = getOrders().map((o: Order) => ({
        id: o.id,
        created_at: o.createdAt,
        status: o.status,
        payment_method: o.paymentMethod,
        subtotal: o.subtotal,
        bundle_discount: o.bundleDiscount ?? null,
        bundle_name: o.bundleName ?? null,
        shipping: o.shipping,
        tax: o.tax,
        total: o.total,
        customer: o.customer,
        items: o.items,
    }));

    const c = getStoreConfig();
    const settings = {
        brand_name: c.brandName,
        brand_tagline: c.brandTagline,
        instagram_handle: c.instagramHandle,
        pickup_address: c.pickupAddress,
        momo_number: c.momoNumber,
        momo_account_name: c.momoAccountName,
        support_phone: c.supportPhone,
        support_email: c.supportEmail,
        runway_display_mode: c.runwayDisplayMode,
        default_bundle_discount_percent: c.defaultBundleDiscountPercent,
        per_look_bundle_discounts: c.perLookBundleDiscounts,
        charge_delivery_fee: c.chargeDeliveryFee,
        delivery_fee_ghs: c.deliveryFeeGhs,
        free_delivery_threshold_ghs: c.freeDeliveryThresholdGhs,
        delivery_turnaround: c.deliveryTurnaround,
        pickup_turnaround: c.pickupTurnaround,
        currency_code: c.currencyCode,
        currency_symbol: c.currencySymbol,
        tax_rate_percent: c.taxRatePercent,
    };

    const { status, data } = await callAdminAuth(
        { action: 'push_data', products, looks, orders, settings },
        session.token,
    );
    const error = typeof data.error === 'string' ? data.error : undefined;
    if (error || status >= 400) {
        throw new Error(error ?? `Push failed (HTTP ${status}).`);
    }

    const counts = (data.counts ?? {}) as Record<string, number>;
    return {
        products: Number(counts.products ?? products.length),
        looks: Number(counts.looks ?? looks.length),
        orders: Number(counts.orders ?? orders.length),
        settings: Number(counts.settings ?? 0) > 0,
    };
}

// Handy for the live demo / debugging from the console:
//   window.runwayPullFromSupabase() / window.runwayPushToSupabase()
declare global {
    interface Window {
        runwayPullFromSupabase?: () => Promise<SupabaseSyncReport | null>;
        runwayPushToSupabase?: () => Promise<SupabasePushReport | null>;
    }
}
if (typeof window !== 'undefined') {
    window.runwayPullFromSupabase = () => pullAllFromSupabase();
    window.runwayPushToSupabase = () => pushAllToSupabase();
}
