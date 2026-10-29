// Page templates (templates/*.jsx) are plain JSX so the docs-site prototype compiler can read them.
declare module '*.jsx' {
  const Template: () => import('react').JSX.Element;
  export default Template;
}
