/** Primitives that components may bind directly and that map to a CSS keyword. */
const PRIMITIVE_KEYWORDS: Record<string, string> = {
  'colors/transparent': 'transparent',
  /** No value (e.g. no shadow): spec bindings use it for variants without an effect style. */
  none: 'none',
}

/** Figma token path → CSS custom property (matches `figma-semantic.css`). */
export function figmaTokenToCssVar(tokenPath: string) {
  return `--${tokenPath.replace(/\//g, '-')}`
}

export function figmaTokenVar(tokenPath: string) {
  return PRIMITIVE_KEYWORDS[tokenPath] ?? `var(${figmaTokenToCssVar(tokenPath)})`
}
