# Imagery

## Photography

The brand library holds 210 photographs (**PhotoLibrary** card; files in `media/assets/photography/`, captions in `media/assets/photography/manifest.json`). They are authentic, human and optimistic: real Nagarro people in real offices, talking, building, presenting. Each photo has a written description, tags, orientation and a people count, so you can choose by content.

- Choose by what the slide says. A slide about collaboration gets people working together; a slide about a workshop gets a whiteboard session.
- Landscape for full-bleed covers and split layouts; portrait for side-by-side text and image.
- Use each photo once per deck.
- No filters, duotones, colour washes or heavy vignettes. Crop, don't distort.
- Type over a photo: white on the darker region, or over a `bg-overlay-50` scrim. Never `fg-50` text on a photo.
- Reference a photo in a template's image field as `assets/photography/<file>` (the engine resolves it against `media/`).

The files here are re-encoded at 1440px on the long side for screen. For print or very large output, use the originals from the source repository's `assets/photography/`.

## Client logos

Logo walls (**LogosAndClients**) take logo image paths. The template examples use logos from the source repository's `assets/client-logos/` (the ones the examples reference are included in `media/`). Only show a client's logo with permission, at equal visual weight, in monochrome when the wall is monochrome.

## Device mockups and product shots

Photo & Gallery, pitch, marketing and social masters include phone, tablet, laptop and hand mockups with their own frames. Put screenshots in the mockup's image field; never paste a screenshot onto a slide without a frame.

## Media paths

Every image path in a template field is site-relative (`assets/…`). `NagarroSlides` rewrites it to `config().assetBase + path`; the default, `../../media/`, works inside this system's previews. When you host the files elsewhere, call `NagarroSlides.config({ assetBase: "<url of the media folder>/" })` first.
