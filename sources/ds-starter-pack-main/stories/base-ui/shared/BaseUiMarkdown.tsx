import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import './docs-markdown.css';
import 'highlight.js/styles/github.css';

type BaseUiMarkdownProps = {
  content: string;
  sourceUrl?: string;
};

function stripLeadingTitle(markdown: string) {
  return markdown
    .replace(/^---\n[\s\S]*?\n---\n+/, '')
    .replace(/^>[\s\S]*?\n\n/, '')
    .replace(/^# .+\n+/m, '');
}

export function BaseUiMarkdown({ content, sourceUrl }: BaseUiMarkdownProps) {
  const body = stripLeadingTitle(content);

  return (
    <div className="base-ui-docs">
      {sourceUrl ? (
        <p>
          Official docs:{' '}
          <a href={sourceUrl} target="_blank" rel="noreferrer">
            {sourceUrl}
          </a>
        </p>
      ) : null}
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {body}
      </ReactMarkdown>
    </div>
  );
}
