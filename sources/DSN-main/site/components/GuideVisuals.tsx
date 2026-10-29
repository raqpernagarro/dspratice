import type { ComponentType } from 'react';
import { Markdown } from './Markdown';
import {
  BackgroundSwatches, ElevationScale, FeedbackSwatches, FontScale, FontWeights, InsetScale, RadiusScale, SpaceScale, TextSwatches,
} from './StyleguideSections';

/**
 * Styleguide visuals per foundation guide, keyed by the start of the `## ` heading
 * they sit under. Each renders directly below its heading, before the token table.
 */
const VISUALS: Record<string, [heading: string, Visual: ComponentType][]> = {
  colors: [['Text color tokens', TextSwatches], ['Background tokens', () => <><BackgroundSwatches /><FeedbackSwatches /></>]],
  typography: [['Font size tokens', FontScale], ['Font weight tokens', FontWeights]],
  spacing: [['Space tokens', SpaceScale], ['Padding (same space scale)', InsetScale], ['Radius tokens', RadiusScale]],
  foundations: [['Effects', ElevationScale]],
};

/** Guide markdown with the matching styleguide visuals spliced in under their headings. */
export function GuideBody({ slug, body }: { slug: string; body: string }) {
  const visuals = VISUALS[slug];
  if (!visuals) return <Markdown>{body}</Markdown>;

  const parts: React.ReactNode[] = [];
  let chunk: string[] = [];
  for (const line of body.split('\n')) {
    chunk.push(line);
    const match = line.startsWith('## ') && visuals.find(([h]) => line.slice(3).startsWith(h));
    if (match) {
      const [heading, Visual] = match;
      parts.push(<Markdown key={`md-${heading}`}>{chunk.join('\n')}</Markdown>, <div key={heading} className="guide-visual"><Visual /></div>);
      chunk = [];
    }
  }
  parts.push(<Markdown key="md-end">{chunk.join('\n')}</Markdown>);
  return <>{parts}</>;
}
