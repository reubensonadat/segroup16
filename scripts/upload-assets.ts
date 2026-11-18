/**
 * OPTIONAL — only needed if you ever decide to mirror the local images into
 * the Supabase `runway-assets` storage bucket. The storefront always serves
 * the local /assets images; this script exists purely as a convenience.
 *
 * Usage:
 *   1. Put SUPABASE_SERVICE_ROLE_KEY in .env.local (Settings → API in the
 *      Supabase dashboard) — the anon key cannot write to the bucket.
 *   2.   npx tsx scripts/upload-assets.ts            # upload only
 *        npx tsx scripts/upload-assets.ts --rewrite  # upload + update DB paths
 */
import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
const SERVICE_ROLE = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
const BUCKET = 'runway-assets';
const ASSETS_DIR = join(process.cwd(), 'public', 'assets');

async function main() {
    if (!SUPABASE_URL || !SERVICE_ROLE) {
        console.error('✗ Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.');
        process.exit(1);
    }
    const db = createClient(SUPABASE_URL, SERVICE_ROLE);

    const files = (await readdir(ASSETS_DIR)).filter((f) => /^fit-\d+-(model|shirt|pants|shoes)\.webp$/.test(f));
    if (files.length === 0) {
        console.error('✗ No fit-*.webp images found in public/assets.');
        process.exit(1);
    }

    const publicUrls = new Map<string, string>(); // 'fit-1-shirt.webp' → https://…/runway-assets/fit-1-shirt.webp
    for (const file of files) {
        const body = await readFile(join(ASSETS_DIR, file));
        const { error } = await db.storage.from(BUCKET).upload(file, body, {
            contentType: 'image/webp',
            upsert: true,
        });
        if (error) {
            console.error(`✗ ${file}: ${error.message}`);
            process.exit(1);
        }
        const { data } = db.storage.from(BUCKET).getPublicUrl(file);
        publicUrls.set(file, data.publicUrl);
        console.log(`✓ uploaded ${file}`);
    }

    if (!process.argv.includes('--rewrite')) {
        console.log(`\nDone — ${files.length} objects in gs://${BUCKET}.`);
        console.log('Run with --rewrite to point the DB rows at the CDN URLs.');
        return;
    }

    // Rewrite products.image / runway_looks.model_image to bucket URLs.
    for (const [file, url] of publicUrls) {
        if (file.includes('-model')) continue; // handled with looks below
        const productId = file.replace('.webp', '');
        const { error } = await db.from('products').update({ image: url }).eq('id', productId);
        if (error) console.error(`✗ products[${productId}]: ${error.message}`);
        else console.log(`↻ products.image → ${url}`);
    }
    for (const [file, url] of publicUrls) {
        if (!file.includes('-model')) continue;
        const lookId = Number(file.match(/fit-(\d+)-model/)?.[1] ?? 0);
        if (!lookId) continue;
        const { error } = await db.from('runway_looks').update({ model_image: url }).eq('id', lookId);
        if (error) console.error(`✗ runway_looks[${lookId}]: ${error.message}`);
        else console.log(`↻ runway_looks.model_image → ${url}`);
    }
    // (Order-item JSON snapshots keep their local /assets paths — the app still
    // bundles those images, so admin/track keep rendering either way.)

    console.log('\nDone — DB rows now serve images from the Supabase CDN.');
}

void main();
