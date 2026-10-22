# Fonts

The Nagarro shell uses **Equip** (body, navigation, labels, UI) and **Equip Extended** (display headings, major statements), as the Nagarro deck does. Both are licensed Hoftype faces under Nagarro's licence. They are bundled here for the Nagarro demo tool only. **Do not redistribute** the files or publish the app to a public host without checking the licence.

`equip/` holds the web files extracted from the practice's Font Squirrel kits (`DS Pratice/Equip_Fonts/Equip_Web`, `DS Pratice/EquipExtended_Fonts/EquipExt_Web`, July 2020). Declarations live in `src/styles/fonts.css`.

| Family | Weight · style | Files |
|---|---|---|
| Equip | 300 light | `equiplig-webfont.woff2` / `.woff` |
| Equip | 400 regular | `equipreg-webfont.woff2` / `.woff` |
| Equip | 400 italic | `equipita-webfont.woff2` / `.woff` |
| Equip | 500 medium | `equipmed-webfont.woff2` / `.woff` |
| Equip | 500 medium italic | `equipmedita-webfont.woff2` / `.woff` |
| Equip | 700 bold | `equipbol-webfont.woff2` / `.woff` |
| Equip | 700 bold italic | `equipbolita-webfont.woff2` / `.woff` |
| Equip Extended | 400 regular | `equipextreg-webfont.woff2` / `.woff` |
| Equip Extended | 500 medium | `equipextmed-webfont.woff2` / `.woff` |
| Equip Extended | 700 bold | `equipextbol-webfont.woff2` / `.woff` |

Kit naming: `Lig` = 300, `Reg` = 400, `Med` = 500, `Bol` = 700, `Ita` suffix = italic. Other kit weights (Thin, Extra light, Extra bold, Black) exist in the source folders and can be added the same way.

The app checks at runtime that both families load (`document.fonts.check`) and shows the result in the Nagarro home's Setup panel. If the files are missing the shell falls back to the system sans-serif, never to another brand font.

Client-brand fonts (Outfit, Figtree, from npm) are used **only inside the scoped client preview** (`.ds-scope`), never in the Nagarro shell.
