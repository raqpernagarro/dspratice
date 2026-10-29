/**
 * Shared semi-transparent fills for hover/press on transparent surfaces (ghost, outline, etc.).
 * Figma `semantic` collection composites — color source + opacity/* primitive.
 */
export const SHARED_OVERLAY_COMPOSITES: Record<string, [string, string]> = {
  'color/background/interactive/subtle/default': ['color/foreground/interactive/default', 'opacity/0'],
  'color/background/interactive/subtle/hover': ['color/foreground/interactive/default', 'opacity/10'],
  'color/background/interactive/subtle/pressed': ['color/foreground/interactive/default', 'opacity/15'],
  'color/background/interactive/danger-subtle/default': ['color/foreground/interactive/default', 'opacity/0'],
  'color/background/interactive/danger-subtle/hover': ['color/background/interactive/danger/default', 'opacity/10'],
  'color/background/interactive/danger-subtle/pressed': ['color/background/interactive/danger/default', 'opacity/20'],
}
