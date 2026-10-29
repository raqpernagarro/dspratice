import React from 'react';
import {
  Title,
  Description,
  Primary,
  Controls,
  Stories,
  Markdown,
} from '@storybook/addon-docs/blocks';
import { useOf } from '@storybook/addon-docs/blocks';

function SpecBody() {
  let body: string | undefined;

  try {
    const { preparedMeta: storyMeta } = useOf('story');
    body = storyMeta?.parameters?.docs?.specBody as string | undefined;
  } catch {
    // Docs page may render outside a single-story context.
  }

  if (!body) {
    const { preparedMeta } = useOf('meta');
    body = preparedMeta.parameters?.docs?.specBody as string | undefined;
  }

  if (!body) {
    return null;
  }

  return <Markdown>{body}</Markdown>;
}

export function DsDocsPage() {
  return (
    <>
      <Title />
      <Description />
      <Primary />
      <Controls />
      <SpecBody />
      <Stories />
    </>
  );
}
