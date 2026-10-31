// Uploads clearly labelled placeholder images to the STAGING bucket for every
// vehicle media row whose object is missing. Existing objects are never
// overwritten. Images say "Staging sample image" so they cannot pass as real
// vehicle photos.
//
//   node scripts/staging-qa/upload-placeholder-media.mjs [--dry-run]
//
// Env: DATABASE_URL, R2_/S3_ ACCESS_KEY_ID, SECRET_ACCESS_KEY, ENDPOINT, BUCKET(_NAME)
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { PrismaClient } from '@automotive-os/database';

const here = dirname(fileURLToPath(import.meta.url));
// sharp is installed as a dependency of Next.js in the marketplace app.
const marketplaceRequire = createRequire(resolve(here, '../../../marketplace/package.json'));
const sharp = createRequire(marketplaceRequire.resolve('next/package.json'))('sharp');

const dryRun = process.argv.includes('--dry-run');
const env = (a, b) => process.env[a] || process.env[b];
const accessKeyId = env('R2_ACCESS_KEY_ID', 'S3_ACCESS_KEY_ID');
const secretAccessKey = env('R2_SECRET_ACCESS_KEY', 'S3_SECRET_ACCESS_KEY');
const endpoint = env('R2_ENDPOINT', 'S3_ENDPOINT');
const bucket = env('R2_BUCKET_NAME', 'S3_BUCKET');

if (!process.env.DATABASE_URL || !accessKeyId || !secretAccessKey || !endpoint || !bucket) {
  console.error('Missing DATABASE_URL or storage credentials. Load .env.staging-qa.local first.');
  process.exit(1);
}
if (!/staging/i.test(bucket)) {
  console.error(`Refusing to write: bucket "${bucket}" is not a staging bucket.`);
  process.exit(1);
}

const s3 = new S3Client({ region: 'auto', endpoint, credentials: { accessKeyId, secretAccessKey }, forcePathStyle: true });
const prisma = new PrismaClient();

const CONTENT_TYPES = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

function escapeXml(s) {
  return s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]);
}

async function placeholder(title, kind, ext) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000">
  <rect width="100%" height="100%" fill="#131313"/>
  <rect x="40" y="40" width="1520" height="920" fill="none" stroke="#d4af37" stroke-width="4" rx="24"/>
  <text x="800" y="440" font-family="Arial, sans-serif" font-size="64" fill="#d4af37" text-anchor="middle">Staging sample image</text>
  <text x="800" y="530" font-family="Arial, sans-serif" font-size="44" fill="#e5e2e1" text-anchor="middle">${escapeXml(title).slice(0, 60)}</text>
  <text x="800" y="600" font-family="Arial, sans-serif" font-size="32" fill="#99907c" text-anchor="middle">${escapeXml(kind)} · not a real vehicle photo</text>
</svg>`;
  const img = sharp(Buffer.from(svg));
  if (ext === 'png') return img.png().toBuffer();
  if (ext === 'webp') return img.webp({ quality: 80 }).toBuffer();
  return img.jpeg({ quality: 82 }).toBuffer();
}

async function exists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (err) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === 'NotFound') return false;
    throw err;
  }
}

try {
  const media = await prisma.vehicleMedia.findMany({
    where: { kind: { in: ['EXTERIOR', 'INTERIOR'] } },
    include: { vehicle: { include: { make: true, model: true } } },
  });
  let uploaded = 0;
  let skipped = 0;
  for (const m of media) {
    const key = m.objectKey.replace(/^\/+/, '');
    if (/^https?:\/\//i.test(key) || key.includes('..')) continue;
    if (await exists(key)) {
      skipped++;
      continue;
    }
    const ext = (key.split('.').pop() || 'jpg').toLowerCase();
    const title = `${m.vehicle.modelYear} ${m.vehicle.make?.name ?? ''} ${m.vehicle.model?.name ?? ''}`.trim();
    if (dryRun) {
      console.log(`would upload ${key}`);
      continue;
    }
    const body = await placeholder(title, m.kind, ext);
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: CONTENT_TYPES[ext] || 'image/jpeg' }));
    uploaded++;
    console.log(`uploaded ${key}`);
  }
  console.log(`done: ${uploaded} uploaded, ${skipped} already present, ${media.length} media rows checked`);
} finally {
  await prisma.$disconnect();
}
