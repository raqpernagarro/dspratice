import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Fenced blocks use `data-language`, not `language-*`, so Prism autoloaders skip them. */
const markdownComponents: Components = {
  code({ className, children, ...props }) {
    const lang = /language-([\w-]+)/.exec(className ?? '')?.[1];
    if (lang) {
      return (
        <code data-language={lang} className="prose-block-code">
          {children}
        </code>
      );
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

/** Renders repo markdown (specs, AI.md, guides) with site prose styles. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
