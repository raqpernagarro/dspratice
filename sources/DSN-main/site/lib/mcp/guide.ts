/** Agent-facing text for the DS-Ngr MCP server. Kept short — tools return the detail. */

export const SERVER_INSTRUCTIONS = `DS-Ngr is Nagarro's design system. This server describes it and draws prototypes with its real components on a shareable live canvas.

Workflow:
1. Call get_design_context first. It returns the active theme (the team's brand, font, shape, density), the usage rules, every component name, and any team kit components to reuse.
2. Before using a component, call get_component for its exact props — never guess prop names (e.g. Tag takes label="…", not children).
3. Write the screen as JSX in the supported subset (see get_design_context → jsxSubset) and call create_prototype. Give the user the liveUrl — the canvas follows every update.
4. Fix every error and warning create_prototype/update_prototype report, then update_prototype with the editToken you got. Repeat until clean.

Never hardcode colours, pixel spacing or fonts: use DS-Ngr tokens (var(--color-…), var(--space-…)). The theme re-values those tokens, so token-based screens follow the team's brand automatically.`;

export const JSX_SUBSET = `Prototypes are JSX parsed (never executed):
- Components: any DS-Ngr export, any lucide-react icon (as <Icon size={16} /> or icon={Icon}), team kit components, and layout HTML (div, span, section, ul/li, strong, img, a…). No <table>, <form>, <script>, <iframe>.
- Values: literals, arrays, objects, JSX, template strings, ternaries, &&/||/??, comparisons and arithmetic.
- Data: top-level or in-component \`const\` with literal values; reference them anywhere.
- Lists: .map/.filter/.slice/.join/.find/.some/.includes and string helpers (toUpperCase, toLocaleString…).
- Render props: arrow functions returning JSX, e.g. DataTable column render: (value, row) => <Tag label={value} />.
- Event handlers (onClick={() => …}) are accepted and do nothing on the canvas. useState renders its initial value.
- Not supported: other hooks, loops, function calls, imports from other packages, class components.
Shape: either a bare JSX element or \`export default function Screen() { return (…) }\`. Full pages: <div style={{ height: '100vh', display: 'flex' }}><AppShell …>…</AppShell></div>.`;

export const KIT_GUIDE = `Team kit components are compositions of DS-Ngr parts, written in the same JSX subset:
export default function ProjectCard({ name, owner, status }) {
  return <Card title={name} showBottomBar={false}>…</Card>;
}
Rules: PascalCase name not already used by DS-Ngr or Lucide; one destructured props parameter; may use other kit components (no loops); children are passed as \`children\`.`;
