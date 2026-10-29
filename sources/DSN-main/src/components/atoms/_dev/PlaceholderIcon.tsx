/**
 * PlaceholderIcon — DEV / STORYBOOK USE ONLY.
 *
 * A 16 × 16 diamond SVG that mirrors the `aa_iconPlaceholder` frame used in
 * the Figma component library. Use this icon exclusively inside *.stories.tsx
 * files so that stories remain icon-library-agnostic.
 *
 * ⚠️  NOT exported from `src/index.ts`.
 */
export function PlaceholderIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Simple outlined diamond / rhombus centred at (8, 8) */}
      <path
        d="M8 2 L14 8 L8 14 L2 8 Z"
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.85}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
