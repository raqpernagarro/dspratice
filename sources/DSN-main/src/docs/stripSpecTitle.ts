export const stripSpecTitle = (raw: string): string =>
  raw.replace(/^#\s.+\n+/, '');

/** First sentence block — the "What it is" lead for docs page header. */
export const extractSpecLead = (raw: string): string => {
  const withoutTitle = stripSpecTitle(raw);

  const whatItIsMatch = withoutTitle.match(
    /## What it is\s*\n+([\s\S]*?)(?=\n## |\n---\s*\n## |$)/,
  );
  if (whatItIsMatch) {
    return whatItIsMatch[1].trim();
  }

  const blocks = withoutTitle.trimStart().split(/\n\n+/);
  for (const block of blocks) {
    const text = block.trim();
    if (!text || text.startsWith('#') || text.startsWith('**') || text === '---') {
      continue;
    }
    return text;
  }

  return '';
};

/** Spec body after the lead — rendered below Controls on docs pages. */
export const stripSpecIntro = (raw: string): string => {
  const withoutTitle = stripSpecTitle(raw).trimStart();

  const whenToUseIndex = withoutTitle.search(/^## When to use\b/m);
  if (whenToUseIndex !== -1) {
    return withoutTitle.slice(whenToUseIndex).trim();
  }

  const lead = extractSpecLead(raw);
  if (!lead) {
    return withoutTitle;
  }

  let rest = withoutTitle.slice(withoutTitle.indexOf(lead) + lead.length).trimStart();
  rest = rest.replace(/^---\n+/, '');
  return rest.trim();
};

/**
 * Docs parameters from the co-located spec. Pass `iframeHeight` for overlays (Modal, Drawer, …):
 * their stories then render in their own iframe on the docs page instead of covering it.
 */
export const specDocsParameters = (specRaw: string, { iframeHeight }: { iframeHeight?: number } = {}) => ({
  docs: {
    description: {
      component: extractSpecLead(specRaw),
    },
    specBody: stripSpecIntro(specRaw),
    ...(iframeHeight ? { story: { inline: false, iframeHeight } } : {}),
  },
});

/** Docs lead for components without a co-located spec file. */
export const leadDocsParameters = (lead: string) => ({
  docs: {
    description: {
      component: lead,
    },
  },
});
