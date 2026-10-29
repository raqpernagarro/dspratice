import { buildStarterFiles, buildStarterZip, StarterUnavailableError } from '@/lib/starter/build-starter';
import { STARTER_PAGES, toPackageName, type StarterPage } from '@/lib/starter/options';
import { decodeBrands, decodeSettings } from '@/lib/theme/theme';

/**
 * Starter pack download: `GET /api/starter?<configurator query>&page=&name=&scope=`.
 * The configurator query (theme settings, optional `brands=`) is the same as
 * the /brands share link. `scope=all` with 2+ brands ships a multi-brand theme.
 * `format=files` answers JSON `{ name, files: { path: base64 } }` instead of a
 * zip — what `ds-ngr create` writes to disk.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = new URLSearchParams(url.search);
  const page = (STARTER_PAGES.some((p) => p.value === params.get('page')) ? params.get('page') : 'blank') as StarterPage;
  const name = toPackageName(params.get('name') ?? '');
  const multi = params.get('scope') === 'all';
  const asFiles = params.get('format') === 'files';
  for (const key of ['page', 'name', 'scope', 'format']) params.delete(key);

  const shareQuery = params.toString();
  const shareUrl = `${url.origin}/brands${shareQuery ? `?${shareQuery}` : ''}`;
  const brandsParam = params.get('brands');
  const brandSet = multi && brandsParam ? decodeBrands(brandsParam) : null;
  params.delete('brands');

  const opts = {
    name,
    page,
    shareUrl,
    theme:
      brandSet && brandSet.brands.length > 1
        ? { kind: 'multi' as const, brands: brandSet.brands, defaultSlug: brandSet.defaultSlug }
        : { kind: 'single' as const, settings: decodeSettings(params.toString()) },
  };

  try {
    if (asFiles) {
      const files = await buildStarterFiles(opts);
      const encoded = Object.fromEntries(Object.entries(files).map(([rel, data]) => [rel, Buffer.from(data).toString('base64')]));
      return Response.json({ name, files: encoded }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const zip = await buildStarterZip(opts);
    return new Response(zip as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${name}.zip"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    if (err instanceof StarterUnavailableError) return Response.json({ error: err.message }, { status: 503 });
    throw err;
  }
}
